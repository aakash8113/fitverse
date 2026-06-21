// Joi Validation Schemas
// Centralized validation for all API endpoints

const Joi = require('joi');

// ============================================
// AUTH VALIDATION
// ============================================

const signupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 100 characters',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().allow('', null).messages({
    'string.pattern.base': 'Please provide a valid phone number',
  }),
  password: Joi.string().min(8).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});

const verifyOTPSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.empty': 'OTP is required',
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must contain only numbers',
  }),
});

const resendOTPSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.empty': 'OTP is required',
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must contain only numbers',
  }),
  newPassword: Joi.string().min(8).required().messages({
    'string.empty': 'New password is required',
    'string.min': 'Password must be at least 8 characters',
  }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
  }),
  newPassword: Joi.string().min(8).required().messages({
    'string.empty': 'New password is required',
    'string.min': 'Password must be at least 8 characters',
  }),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 100 characters',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().allow('', null).messages({
    'string.pattern.base': 'Please provide a valid phone number',
  }),
});

// ============================================
// PRODUCT VALIDATION
// ============================================

const GENDERS      = ['MENS', 'WOMENS'];
const WEAR_TYPES   = ['TOPWEAR', 'BOTTOMWEAR'];
const CATEGORIES   = ['TSHIRT', 'SHIRT', 'HOODIE', 'JACKET', 'KURTI', 'GOWN', 'JEANS', 'TROUSER', 'TRACKPANT', 'CARGO', 'SLAX'];
const SUB_CATEGORIES = [
  'OVERSIZED', 'POLO', 'DROP_SHOULDER', 'V_NECK', 'SHORT_SLEEVED', 'LONG_SLEEVED',
  'PRINTED', 'PLAIN', 'TEXTURED',
  'DENIM', 'SKINNY', 'BAGGY', 'BOOT_CUT',
];

const createProductSchema = Joi.object({
  name: Joi.string().min(3).max(200).required().messages({
    'string.empty': 'Product name is required',
    'string.min': 'Product name must be at least 3 characters',
  }),
  description: Joi.string().min(10).required().messages({
    'string.empty': 'Product description is required',
    'string.min': 'Description must be at least 10 characters',
  }),
  price: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Price must be a number',
    'number.positive': 'Price must be positive',
    'any.required': 'Price is required',
  }),
  // sizeStock: JSON string or object, e.g. {"S":4,"M":10}
  sizeStock: Joi.alternatives()
    .try(
      Joi.object().pattern(Joi.string(), Joi.number().integer().min(0)),
      Joi.string(),
    )
    .optional(),
  brand: Joi.string().max(100).optional().allow(''),
  gender: Joi.string().valid(...GENDERS).required().messages({
    'any.only': 'Gender must be MENS or WOMENS',
    'any.required': 'Gender is required',
  }),
  wearType: Joi.string().valid(...WEAR_TYPES).required().messages({
    'any.only': 'WearType must be TOPWEAR or BOTTOMWEAR',
    'any.required': 'WearType is required',
  }),
  category: Joi.string().valid(...CATEGORIES).required().messages({
    'any.only': 'Invalid clothing category',
    'any.required': 'Category is required',
  }),
  subCategory: Joi.string().valid(...SUB_CATEGORIES).optional().allow('', null),
  // availableSizes sent as JSON string or comma-separated from FormData
  availableSizes: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string()).min(1),
      Joi.string().min(1),
    )
    .optional(),
  isThrift: Joi.boolean().optional(),
  thriftCondition: Joi.string().valid('POOR', 'FAIR', 'GOOD', 'VERY_GOOD', 'LIKE_NEW').optional().allow('', null),
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(3).max(200).optional(),
  description: Joi.string().min(10).optional(),
  price: Joi.number().positive().precision(2).optional(),
  sizeStock: Joi.alternatives()
    .try(
      Joi.object().pattern(Joi.string(), Joi.number().integer().min(0)),
      Joi.string(),
    )
    .optional(),
  brand: Joi.string().max(100).optional().allow(''),
  gender: Joi.string().valid(...GENDERS).optional(),
  wearType: Joi.string().valid(...WEAR_TYPES).optional(),
  category: Joi.string().valid(...CATEGORIES).optional(),
  subCategory: Joi.string().valid(...SUB_CATEGORIES).optional().allow('', null),
  availableSizes: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string()).min(1),
      Joi.string().min(1),
    )
    .optional(),
  isActive: Joi.boolean().optional(),
  isThrift: Joi.boolean().optional(),
  thriftCondition: Joi.string().valid('POOR', 'FAIR', 'GOOD', 'VERY_GOOD', 'LIKE_NEW').optional().allow('', null),
});

// ============================================
// CART VALIDATION
// ============================================

const addToCartSchema = Joi.object({
  productId: Joi.string().uuid().required().messages({
    'string.empty': 'Product ID is required',
    'string.guid': 'Invalid product ID format',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number',
    'number.min': 'Quantity must be at least 1',
  }),
  size: Joi.string().allow('').optional(),
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number',
    'number.min': 'Quantity must be at least 1',
  }),
});

// ============================================
// ORDER VALIDATION
// ============================================

const createOrderSchema = Joi.object({
  addressId: Joi.string().uuid().required().messages({
    'string.empty': 'Address ID is required',
    'string.guid': 'Invalid address ID format',
  }),
  paymentMethod: Joi.string().valid('CARD', 'COD', 'WALLET', 'COINS').required().messages({
    'any.only': 'Invalid payment method',
    'any.required': 'Payment method is required',
  }),
  coinsToUse: Joi.number().integer().min(0).optional(),
  productIds: Joi.array().items(Joi.string().uuid()).optional(),
  couponCode: Joi.string().max(50).optional().allow('', null),
});

// ============================================
// ADDRESS VALIDATION
// ============================================

const createAddressSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^[+]?[\d\s\-().]{6,20}$/).required(),
  addressLine1: Joi.string().min(5).max(200).required(),
  addressLine2: Joi.string().max(200).optional().allow('', null),
  city: Joi.string().min(2).max(100).required(),
  state: Joi.string().min(2).max(100).required(),
  zipCode: Joi.string().min(3).max(20).required(),
  country: Joi.string().min(2).max(100).default('United States'),
  isDefault: Joi.boolean().optional().default(false),
});

const updateAddressSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^[+]?[\d\s\-().]{6,20}$/).optional(),
  addressLine1: Joi.string().min(5).max(200).optional(),
  addressLine2: Joi.string().max(200).optional().allow('', null),
  city: Joi.string().min(2).max(100).optional(),
  state: Joi.string().min(2).max(100).optional(),
  zipCode: Joi.string().min(3).max(20).optional(),
  country: Joi.string().min(2).max(100).optional(),
  isDefault: Joi.boolean().optional(),
});

// ============================================
// RETURNS & REPLACEMENTS VALIDATION
// ============================================

const RETURN_TYPES   = ['RETURN', 'REPLACEMENT'];
const RETURN_REASONS = ['DAMAGED', 'WRONG_ITEM', 'SIZE_ISSUE', 'QUALITY_ISSUE', 'OTHER'];
const RETURN_STATUSES = [
  'REQUESTED', 'APPROVED', 'REJECTED',
  'ITEM_RECEIVED', 'REFUND_INITIATED', 'REPLACEMENT_SHIPPED', 'COMPLETED', 'CANCELLED',
];

const returnItemSchema = Joi.object({
  orderItemId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).default(1),
});

const createReturnRequestSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  type: Joi.string().valid(...RETURN_TYPES).required(),
  reason: Joi.string().valid(...RETURN_REASONS).required(),
  description: Joi.string().max(1000).optional().allow('', null),
  images: Joi.array().items(Joi.string()).max(5).optional().default([]),
  replacementSize: Joi.string().optional().allow('', null),
  bankAccountName: Joi.string().max(100).optional().allow('', null),
  bankAccountNumber: Joi.string().max(30).optional().allow('', null),
  bankIFSC: Joi.string().max(20).optional().allow('', null),
  upiHandle: Joi.string().max(100).optional().allow('', null),
  items: Joi.array().items(returnItemSchema).min(1).required(),
});

const updateReturnStatusSchema = Joi.object({
  status: Joi.string().valid(...RETURN_STATUSES).required(),
  adminNote: Joi.string().max(1000).optional().allow('', null),
});

module.exports = {
  // Auth
  signupSchema,
  loginSchema,
  verifyOTPSchema,
  resendOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  
  // Product
  createProductSchema,
  updateProductSchema,
  
  // Cart
  addToCartSchema,
  updateCartItemSchema,
  
  // Order
  createOrderSchema,
  
  // Address
  createAddressSchema,
  updateAddressSchema,

  // Returns
  createReturnRequestSchema,
  updateReturnStatusSchema,
};
