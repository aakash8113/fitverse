// Shipping Service — Shiprocket API v2
// Handles all Shiprocket integration: authentication, order creation, AWB, labels, tracking
// Docs: https://apiv2.shiprocket.in/v1/external

const axios = require('axios');
const config = require('../config/env');
const logger = require('../config/logger');

const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

// ── Standard weight/dimensions by clothing category ──────────────────────
const CATEGORY_DIMENSIONS = {
  TSHIRT:     { weight: 200,  length: 30, breadth: 20, height: 3  },
  SHIRT:      { weight: 250,  length: 30, breadth: 25, height: 4  },
  HOODIE:     { weight: 400,  length: 35, breadth: 28, height: 8  },
  JACKET:     { weight: 500,  length: 40, breadth: 30, height: 10 },
  KURTI:      { weight: 350,  length: 35, breadth: 25, height: 8  },
  GOWN:       { weight: 600,  length: 45, breadth: 30, height: 12 },
  JEANS:      { weight: 500,  length: 35, breadth: 25, height: 6  },
  TROUSER:    { weight: 400,  length: 35, breadth: 25, height: 5  },
  TRACKPANT:  { weight: 350,  length: 30, breadth: 25, height: 5  },
  CARGO:      { weight: 450,  length: 35, breadth: 25, height: 6  },
  SLAX:       { weight: 400,  length: 35, breadth: 25, height: 5  },
};

/**
 * Get default dimensions for a product category.
 * Falls back to T-shirt defaults if category unknown.
 */
function getCategoryDimensions(category) {
  return CATEGORY_DIMENSIONS[category] || CATEGORY_DIMENSIONS.TSHIRT;
}

// ── Auth — Bearer token (cached) ─────────────────────────────────────────
let _token = null;
let _tokenExpiresAt = 0;

/**
 * Authenticate with Shiprocket and return a bearer token.
 * Token is valid for 10 days; we cache it and refresh when needed.
 */
async function authenticate() {
  // If token is still valid for at least 1 hour, reuse it
  if (_token && Date.now() < _tokenExpiresAt - 3600000) {
    return _token;
  }

  const { email, password } = config.shiprocket;
  if (!email || !password) {
    throw new Error('Shiprocket credentials not configured (SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD)');
  }

  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, { email, password });
    const { token } = response.data;

    _token = token;
    _tokenExpiresAt = Date.now() + (10 * 24 * 60 * 60 * 1000); // 10 days

    logger.info('Shiprocket authentication successful');
    return token;
  } catch (error) {
    logger.error(`Shiprocket auth failed: ${error.response?.data?.message || error.message}`);
    throw new Error(`Shiprocket authentication failed: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Get axios instance with auth header.
 */
async function getApi() {
  const token = await authenticate();
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

// ── Check Courier Serviceability ─────────────────────────────────────────
/**
 * Check which couriers can deliver to a pincode.
 * @param {Object} opts
 * @param {string} opts.deliveryPincode - Delivery pincode
 * @param {string} opts.pickupPincode - Pickup pincode (default: warehouse)
 * @param {number} opts.weight - Weight in kg
 * @param {boolean} opts.cod - Whether order is COD
 * @returns {Promise<Array>} List of available couriers
 */
async function checkServiceability({ deliveryPincode, pickupPincode = '', weight = 0.5, cod = false }) {
  const api = await getApi();

  const params = {
    delivery_postcode: deliveryPincode,
    cod: cod ? 1 : 0,
    weight: String(weight),
  };

  if (pickupPincode) {
    params.pickup_postcode = pickupPincode;
  }

  try {
    const response = await api.get('/courier/serviceability/', { params });
    const data = response.data.data;

    if (!data || !data.available_courier_companies) {
      return { serviceable: false, couriers: [], recommended: null };
    }

    return {
      serviceable: data.available_courier_companies.length > 0,
      couriers: data.available_courier_companies.map((c) => ({
        id: c.courier_company_id,
        name: c.courier_name,
        rate: c.rate,
        cod: c.cod === 1,
        estimatedDays: c.estimated_delivery_days,
        etd: c.etd,
        rating: c.rating,
        minWeight: c.min_weight,
        courierType: c.courier_type,
      })),
      recommended: data.recommended_courier_company_id
        ? { id: data.recommended_courier_company_id, name: data.recommended_by?.title }
        : null,
    };
  } catch (error) {
    logger.error(`Shiprocket serviceability check failed: ${error.response?.data?.message || error.message}`);
    throw new Error(`Serviceability check failed: ${error.response?.data?.message || error.message}`);
  }
}

// ── Create Order + AWB + Label + Pickup (Wrapper API) ────────────────────
/**
 * Create a shipment on Shiprocket using the forward-shipment wrapper API.
 * This single call creates the order, generates AWB, label, and schedules pickup.
 * @param {Object} opts
 * @param {string} opts.orderId - Our internal order ID used as Shiprocket order_id
 * @param {string} opts.orderDate - Order date in YYYY-MM-DD format
 * @param {Object} opts.billing - { name, address, city, state, country, pincode, phone, email }
 * @param {Object} opts.shipping - Same structure as billing (or use billing_is_shipping)
 * @param {Array} opts.items - [{ name, sku, units, selling_price, hsn }]
 * @param {string} opts.paymentMethod - "COD" or "Prepaid"
 * @param {number} opts.subTotal - Subtotal in INR
 * @param {number} opts.weight - Total weight in kg (sum of all items)
 * @param {number} opts.length - Package length in cm
 * @param {number} opts.breadth - Package breadth in cm
 * @param {number} opts.height - Package height in cm
 * @param {string} opts.pickupLocation - Pickup location name (will be auto-created if new)
 * @param {Object} [opts.pickupAddress] - Pickup address details for vendor_details
 * @param {number} opts.courierId - Optional: specific courier to use
 * @returns {Promise<Object>} Shipment details
 */
async function createShipment({
  orderId,
  orderDate,
  billing,
  shipping,
  items,
  paymentMethod,
  subTotal,
  total,
  weight,
  length,
  breadth,
  height,
  pickupLocation,
  pickupAddress,
  courierId,
}) {
  const api = await getApi();

  const shippingIsBilling = !shipping || (
    billing.name === shipping.name &&
    billing.address === shipping.address &&
    billing.pincode === shipping.pincode
  );

  const payload = {
    order_id: String(orderId),
    order_date: orderDate,
    pickup_location: pickupLocation,

    // Billing (always required)
    billing_customer_name: billing.name,
    billing_last_name: '',
    billing_address: billing.address,
    billing_city: billing.city,
    billing_state: billing.state,
    billing_country: billing.country || 'India',
    billing_pincode: billing.pincode,
    billing_email: billing.email,
    billing_phone: billing.phone,

    // Shipping
    shipping_is_billing: shippingIsBilling,
    ...(shippingIsBilling ? {} : {
      shipping_customer_name: shipping.name,
      shipping_address: shipping.address,
      shipping_city: shipping.city,
      shipping_state: shipping.state,
      shipping_country: shipping.country || 'India',
      shipping_pincode: shipping.pincode,
      shipping_email: shipping.email,
      shipping_phone: shipping.phone,
    }),

    // Items
    order_items: items.map((item) => ({
      name: item.name,
      sku: item.sku || item.name,
      units: item.units,
      selling_price: item.selling_price,
      hsn: item.hsn || '',
      discount: item.discount || 0,
      tax: item.tax || 0,
    })),

    // Payment
    payment_method: paymentMethod === 'COD' ? 'COD' : 'Prepaid',
    sub_total: Math.round(subTotal),
    total_discount: 0,
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,

    // Dimensions
    weight: String(weight),
    length: String(length),
    breadth: String(breadth),
    height: String(height),

    // Vendor details — creates pickup location on the fly if it doesn't exist in Shiprocket
    ...(pickupAddress ? {
      vendor_details: {
        email: pickupAddress.email,
        phone: pickupAddress.phone,
        name: pickupAddress.name,
        address: pickupAddress.address,
        address_2: pickupAddress.address2 || '',
        city: pickupAddress.city,
        state: pickupAddress.state,
        country: pickupAddress.country || 'India',
        pin_code: pickupAddress.pincode,
        pickup_location: pickupLocation,
      },
    } : {}),

    // Optional: specific courier
    ...(courierId ? { courier_id: courierId } : {}),

    // Auto-generate everything
    request_pickup: true,
    print_label: true,
    generate_manifest: true,
  };

  try {
    const response = await api.post('/shipments/create/forward-shipment', payload);
    const result = response.data;

    if (result.status !== 1) {
      const errMsg = result.payload?.error_message || 'Unknown Shiprocket error';
      logger.error(`Shiprocket createShipment failed: ${errMsg}`);
      throw new Error(`Shiprocket order creation failed: ${errMsg}`);
    }

    const p = result.payload;

    logger.info(`Shiprocket shipment created | orderId=${p.order_id} | awb=${p.awb_code} | courier=${p.courier_name}`);

    return {
      success: true,
      shiprocketOrderId: p.order_id,
      shipmentId: p.shipment_id,
      awbCode: p.awb_code,
      courierId: p.courier_company_id,
      courierName: p.courier_name,
      labelUrl: p.label_url,
      manifestUrl: p.manifest_url,
      pickupScheduledDate: p.pickup_scheduled_date,
      pickupTokenNumber: p.pickup_token_number,
      routingCode: p.routing_code,
      appliedWeight: p.applied_weight,
    };
  } catch (error) {
    if (error.response) {
      logger.error(`Shiprocket API error: ${JSON.stringify(error.response.data)}`);
      throw new Error(`Shiprocket error: ${error.response.data?.message || JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// ── Generate AWB for Existing Shipment ───────────────────────────────────
/**
 * Generate/assign AWB for a shipment (if not done via wrapper).
 * @param {number} shipmentId - Shiprocket shipment ID
 * @param {number} [courierId] - Optional specific courier
 */
async function generateAWB({ shipmentId, courierId }) {
  const api = await getApi();

  const payload = { shipment_id: shipmentId };
  if (courierId) payload.courier_id = courierId;

  try {
    const response = await api.post('/courier/assign/awb', payload);
    const { awb_code, courier_name, courier_company_id } = response.data.response?.data || {};
    return { awbCode: awb_code, courierName: courier_name, courierId: courier_company_id };
  } catch (error) {
    logger.error(`Shiprocket AWB generation failed: ${error.message}`);
    throw error;
  }
}

// ── Generate Label ───────────────────────────────────────────────────────
/**
 * Generate shipping label for a shipment.
 * @param {number} shipmentId - Shiprocket shipment ID
 */
async function generateLabel({ shipmentId }) {
  const api = await getApi();
  try {
    const response = await api.post('/courier/generate/label', { shipment_id: [shipmentId] });
    return { labelUrl: response.data.label_url, labelCreated: response.data.label_created === 1 };
  } catch (error) {
    logger.error(`Shiprocket label generation failed: ${error.message}`);
    throw error;
  }
}

// ── Schedule Pickup ─────────────────────────────────────────────────────
/**
 * Schedule pickup for a shipment.
 * @param {number} shipmentId - Shiprocket shipment ID
 */
async function schedulePickup({ shipmentId }) {
  const api = await getApi();
  try {
    const response = await api.post('/courier/generate/pickup', { shipment_id: [shipmentId] });
    return {
      pickupStatus: response.data.pickup_status === 1,
      pickupScheduledDate: response.data.response?.pickup_scheduled_date,
      pickupTokenNumber: response.data.response?.pickup_token_number,
    };
  } catch (error) {
    logger.error(`Shiprocket pickup scheduling failed: ${error.message}`);
    throw error;
  }
}

// ── Cancel Shipment ─────────────────────────────────────────────────────
/**
 * Cancel a shipment by AWB.
 * @param {string} awbCode - AWB code to cancel
 */
async function cancelShipment(awbCode) {
  const api = await getApi();
  try {
    await api.post('/orders/cancel/shipment/awbs', { awbs: [awbCode] });
    logger.info(`Shiprocket shipment cancelled: AWB ${awbCode}`);
    return { success: true };
  } catch (error) {
    logger.error(`Shiprocket shipment cancellation failed: ${error.message}`);
    throw error;
  }
}

// ── Track Shipment ─────────────────────────────────────────────────────
/**
 * Track a shipment by AWB code.
 * Returns the Shiprocket order detail which includes tracking info.
 * @param {string} awbCode - AWB code
 */
async function trackShipment(awbCode) {
  const api = await getApi();
  try {
    const response = await api.get('/orders/show', { params: { awb: awbCode } });
    return response.data;
  } catch (error) {
    logger.error(`Shiprocket tracking failed: ${error.message}`);
    throw error;
  }
}

// ── Webhook Validation ─────────────────────────────────────────────────
/**
 * Validate an incoming Shiprocket webhook.
 * Shiprocket webhooks include an x-api-key header if configured.
 * @param {string} authorization - x-api-key header value
 * @param {Object} body - Request body
 */
function validateWebhook(authorization, body) {
  const { webhookToken } = config.shiprocket;
  if (webhookToken && authorization !== webhookToken) {
    logger.warn('Shiprocket webhook validation failed: invalid token');
    return false;
  }
  return true;
}

// ── Webhook Status Mapping ──────────────────────────────────────────────
/**
 * Map Shiprocket webhook status to our order status.
 * @param {string} shiprocketStatus - current_status from webhook
 * @param {number} statusCode - status_code from webhook
 * @returns {string} Our OrderStatus value
 */
function mapWebhookStatus(shiprocketStatus, statusCode) {
  // Map Shiprocket status codes to our OrderStatus
  const statusMap = {
    // Delivered
    '7': 'DELIVERED',
    // Shipped / In Transit / Out for Delivery
    '6': 'SHIPPED',
    '18': 'SHIPPED',
    '19': 'SHIPPED',
    '42': 'SHIPPED',
    // Cancelled / RTO
    '5': 'CANCELLED',
    '8': 'CANCELLED',
    '9': 'CANCELLED',
    '10': 'CANCELLED',
    '15': 'CANCELLED',
    '16': 'CANCELLED',
    '46': 'CANCELLED',
  };

  const statusStringMap = {
    'DELIVERED': 'DELIVERED',
    'SHIPPED': 'SHIPPED',
    'IN TRANSIT': 'SHIPPED',
    'OUT FOR DELIVERY': 'SHIPPED',
    'PICKED UP': 'SHIPPED',
    'CANCELLED': 'CANCELLED',
    'RTO': 'CANCELLED',
    'RTO DELIVERED': 'CANCELLED',
  };

  return statusMap[String(statusCode)] || statusStringMap[shiprocketStatus?.toUpperCase()] || null;
}

// ── Add Pickup Address to Shiprocket ─────────────────────────────────
/**
 * Register a seller's pickup address in Shiprocket using the dedicated API.
 * Uses a structured nickname: seller_{sellerId}
 * @param {Object} opts
 * @param {string} opts.nickname - Pickup location nickname (e.g. "seller_abc123")
 * @param {string} opts.name - Shipper's name
 * @param {string} opts.email - Shipper's email
 * @param {string} opts.phone - Shipper's phone
 * @param {string} opts.address - Pickup address line 1
 * @param {string} opts.address2 - Pickup address line 2
 * @param {string} opts.city - City
 * @param {string} opts.state - State
 * @param {string} opts.pincode - Pincode
 * @param {string} opts.country - Country (default: India)
 * @returns {Promise<Object>} Result with pickup_location name
 */
async function addPickupAddress({ nickname, name, email, phone, address, address2, city, state, pincode, country = 'India' }) {
  const api = await getApi();

  const payload = {
    pickup_location: nickname,
    name,
    email,
    phone,
    address,
    address_2: address2 || '',
    city,
    state,
    country,
    pin_code: pincode,
  };

  try {
    const response = await api.post('/addresses/pickup/add', payload);
    logger.info(`Shiprocket pickup address created: ${nickname}`);
    return { success: true, pickupLocation: nickname };
  } catch (error) {
    if (error.response) {
      // If it already exists, that's fine — nickname is already registered
      const errMsg = error.response.data?.message || '';
      if (errMsg.includes('already') || error.response.status === 422) {
        logger.warn(`Shiprocket pickup address may already exist: ${nickname} — ${errMsg}`);
        return { success: true, pickupLocation: nickname, alreadyExists: true };
      }
      logger.error(`Shiprocket addPickupAddress error: ${JSON.stringify(error.response.data)}`);
      throw new Error(`Shiprocket pickup address creation failed: ${error.response.data?.message || JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

module.exports = {
  authenticate,
  checkServiceability,
  createShipment,
  generateAWB,
  generateLabel,
  schedulePickup,
  cancelShipment,
  trackShipment,
  validateWebhook,
  mapWebhookStatus,
  getCategoryDimensions,
  CATEGORY_DIMENSIONS,
  addPickupAddress,
};
