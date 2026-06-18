// API Service Layer - Axios instance with interceptors and all backend endpoints

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AUTH_STATE_EVENT = 'fitverse:auth-state-changed';

const emitAuthStateChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_STATE_EVENT));
  }
};

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

const isEmailNotVerifiedResponse = (error: AxiosError<ApiErrorResponse>) => {
  const status = error.response?.status;
  const code = error.response?.data?.code;
  const message = String(error.response?.data?.message || '').toLowerCase();

  if (status !== 403) return false;
  if (code === 'EMAIL_NOT_VERIFIED') return true;
  return message.includes('verify your email');
};

// Request interceptor - Add JWT token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (isEmailNotVerifiedResponse(error)) {
      const currentPath = window.location.pathname;
      const inVerificationFlow = currentPath === '/settings' || currentPath === '/verify-email';

      if (!inVerificationFlow) {
        sessionStorage.setItem('fitverse_post_verify_redirect', `${window.location.pathname}${window.location.search}`);
        window.location.href = '/settings?verify=email';
      }
    }

    // Handle unauthorized errors
    if (error.response?.status === 401) {
      const isOnLoginPage = window.location.pathname === '/login';
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isGetMeRequest = error.config?.url?.includes('/auth/me');
      
      if (!isOnLoginPage && !isLoginRequest && !isGetMeRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        emitAuthStateChanged();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'USER' | 'ADMIN' | 'SELLER' | 'BUSINESS';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  coinBalance: number;
  aiCredits: number;
  aiTryOnCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: Array<{ field: string; message: string }>;
}

export type Gender = 'MENS' | 'WOMENS';
export type WearType = 'TOPWEAR' | 'BOTTOMWEAR';
export type ClothingCategory =
  | 'TSHIRT' | 'SHIRT' | 'HOODIE' | 'JACKET'
  | 'JEANS' | 'TROUSER' | 'TRACKPANT' | 'CARGO';
export type ClothingSubCategory =
  | 'OVERSIZED' | 'POLO' | 'DROP_SHOULDER' | 'V_NECK' | 'SHORT_SLEEVED' | 'LONG_SLEEVED'
  | 'PRINTED' | 'PLAIN' | 'TEXTURED'
  | 'DENIM' | 'SKINNY' | 'BAGGY' | 'BOOT_CUT';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sizeStock: Record<string, number>;
  brand?: string;
  gender: Gender;
  wearType: WearType;
  category: ClothingCategory;
  subCategory?: ClothingSubCategory;
  availableSizes: string[];
  isThrift: boolean;
  thriftCondition?: string;
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CarouselPlacement = 'HOME' | 'SHOP';

export interface CarouselSlide {
  imageUrl: string;
  altText?: string | null;
  sortOrder: number;
}

export const getTotalStock = (sizeStock?: Record<string, number>): number =>
  Object.values(sizeStock || {}).reduce((s, v) => s + (v || 0), 0);

export const getSizeStock = (sizeStock: Record<string, number> | undefined, size: string): number =>
  (sizeStock || {})[size] ?? 0;

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  size: string;
  product: Product;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  size: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  addressId: string;
  paymentMethod: 'CARD' | 'COD' | 'WALLET' | 'COINS';
  paymentStatus: string;
  paymentId?: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  coinsUsed?: number;
  couponCode?: string;
  couponDiscount?: number;
  status: 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  deliveredAt?: string;
  items: OrderItem[];
  address?: Address;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// AUTHENTICATION API
// ============================================

export const authApi = {
  signup: async (data: { name: string; email: string; password: string; phone?: string }) => {
    const response = await api.post<ApiResponse<User>>('/auth/signup', data);
    return response.data;
  },
  verifyEmail: async (data: { email: string; otp: string }) => {
    const response = await api.post<ApiResponse>('/auth/verify-email', data);
    return response.data;
  },
  login: async (data: { email: string; password: string }) => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
    if (response.data.success && response.data.data) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      emitAuthStateChanged();
    }
    return response.data;
  },
  resendOtp: async (data: { email: string }) => {
    const response = await api.post<ApiResponse>('/auth/resend-otp', data);
    return response.data;
  },
  forgotPassword: async (data: { email: string }) => {
    const response = await api.post<ApiResponse>('/auth/forgot-password', data);
    return response.data;
  },
  resetPassword: async (data: { email: string; otp: string; newPassword: string }) => {
    const response = await api.post<ApiResponse>('/auth/reset-password', data);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },
  updateProfile: async (data: { name: string; email: string; phone?: string | null }) => {
    const response = await api.put<ApiResponse<User>>('/auth/profile', data);
    if (response.data.success && response.data.data) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
      emitAuthStateChanged();
    }
    return response.data;
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await api.put<ApiResponse>('/auth/change-password', data);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    emitAuthStateChanged();
  },
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) { try { return JSON.parse(userStr); } catch { return null; } }
    return null;
  },
  isAuthenticated: (): boolean => !!localStorage.getItem('token'),
  authStateEventName: AUTH_STATE_EVENT,
};

export interface LoginResponse {
  user: User;
  token: string;
}

// ============================================
// PRODUCTS API
// ============================================

export const productsApi = {
  getProducts: async (params?: { page?: number; limit?: number; gender?: string; wearType?: string; category?: string; subCategory?: string; size?: string; isThrift?: boolean; minPrice?: number; maxPrice?: number; search?: string; sortBy?: string }) => {
    const response = await api.get<PaginatedResponse<Product>>('/products', { params });
    return response.data;
  },
  getProduct: async (id: string) => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },
  createProduct: async (formData: FormData) => {
    const response = await api.post<ApiResponse<Product>>('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
  },
  updateProduct: async (id: string, formData: FormData) => {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
  },
  deleteProduct: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/products/${id}`);
    return response.data;
  },
  deleteProductImage: async (productId: string, imagePath: string) => {
    const response = await api.delete<ApiResponse>(`/products/${productId}/images`, { data: { imagePath } });
    return response.data;
  },
};

export const carouselApi = {
  getSlides: async (placement: CarouselPlacement) => {
    const response = await api.get<ApiResponse<CarouselSlide[]>>(`/carousels/${placement}`);
    return response.data;
  },
};

// ============================================
// CART API
// ============================================

export const cartApi = {
  getCart: async () => { const r = await api.get<ApiResponse<Cart>>('/cart'); return r.data; },
  addToCart: async (data: { productId: string; quantity: number; size?: string }) => { const r = await api.post<ApiResponse<Cart>>('/cart', data); return r.data; },
  updateCartItem: async (itemId: string, data: { quantity: number }) => { const r = await api.put<ApiResponse<Cart>>(`/cart/${itemId}`, data); return r.data; },
  removeFromCart: async (itemId: string) => { const r = await api.delete<ApiResponse<Cart>>(`/cart/${itemId}`); return r.data; },
  clearCart: async () => { const r = await api.delete<ApiResponse>('/cart'); return r.data; },
};

// ============================================
// ORDERS API
// ============================================

export const ordersApi = {
  createOrder: async (data: { addressId: string; paymentMethod: 'CARD' | 'COD' | 'WALLET' | 'COINS'; productIds?: string[]; coinsToUse?: number; couponCode?: string }) => { const r = await api.post<ApiResponse<Order>>('/orders', data); return r.data; },
  getMyOrders: async (status?: string) => { const r = await api.get<ApiResponse<Order[]>>('/orders', { params: status ? { status } : undefined }); return r.data; },
  getOrder: async (id: string) => { const r = await api.get<ApiResponse<Order>>(`/orders/${id}`); return r.data; },
  cancelOrder: async (id: string) => { const r = await api.put<ApiResponse<Order>>(`/orders/${id}/cancel`); return r.data; },
  trackOrder: async (orderNumber: string, email: string) => { const r = await api.get<ApiResponse<any>>('/orders/track', { params: { orderNumber, email } }); return r.data; },
  getAllOrders: async () => { const r = await api.get<ApiResponse<Order[]>>('/orders/admin/all'); return r.data; },
  updateOrderStatus: async (id: string, data: { status: string }) => { const r = await api.put<ApiResponse<Order>>(`/orders/${id}/status`, data); return r.data; },
};

// ============================================
// ADDRESSES API
// ============================================

export const addressesApi = {
  getAddresses: async () => { const r = await api.get<ApiResponse<Address[]>>('/addresses'); return r.data; },
  getAddress: async (id: string) => { const r = await api.get<ApiResponse<Address>>(`/addresses/${id}`); return r.data; },
  createAddress: async (data: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => { const r = await api.post<ApiResponse<Address>>('/addresses', data); return r.data; },
  updateAddress: async (id: string, data: Partial<Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => { const r = await api.put<ApiResponse<Address>>(`/addresses/${id}`, data); return r.data; },
  deleteAddress: async (id: string) => { const r = await api.delete<ApiResponse>(`/addresses/${id}`); return r.data; },
};

// ============================================
// ADMIN API
// ============================================

export interface AdminUser extends User {
  _count?: { orders: number };
  isBlocked?: boolean;
  coinBalance: number;
}
export interface CoinTransaction { id: string; userId: string; amount: number; type: 'THRIFT_REWARD' | 'ORDER_PAYMENT' | 'ADMIN_ADJUSTMENT'; description: string; referenceId?: string; createdAt: string; }
export interface AiCreditPack { id: string; credits: number; amountInPaise: number; amount: number; label: string; subtitle?: string; }
export interface AiCreditPurchase { id: string; userId: string; credits: number; amountInPaise: number; status: 'PENDING' | 'COMPLETED' | 'FAILED'; razorpayOrderId?: string | null; razorpayPaymentId?: string | null; createdAt: string; updatedAt: string; }
export interface AiUsageSummary { id: string; name: string; email: string; aiCredits: number; aiTryOnCount: number; totalTryOns: number; successRate: number; purchases: AiCreditPurchase[]; createdAt: string; }
export interface DashboardStats { totalUsers: number; totalProducts: number; totalOrders: number; monthlyRevenue: number; thriftRequestCount: number; aiTryOnCount: number; revenueByMonth: { month: string; revenue: number }[]; inventoryByCategory: { category: string; count: number }[]; recentOrders: Order[]; }
export interface ThriftRequest { id: string; userId: string; userName: string; userEmail: string; address: string; pickupDate: string; pickupTime: string; itemDescription: string; images: string[]; status: 'PENDING' | 'PICKED_UP' | 'UNDER_REFURBISHMENT' | 'APPROVED' | 'REJECTED'; createdAt: string; updatedAt: string; }
export interface RefurbishmentItem { id: string; thriftRequestId: string; itemName: string; originalImages: string[]; refurbishedImages: string[]; notes: string; cost: number; finalPrice: number; status: 'IN_PROGRESS' | 'COMPLETED' | 'IN_INVENTORY'; createdAt: string; updatedAt: string; }
export interface ThriftInventoryItem { id: string; name: string; description: string; price: number; stock: number; images: string[]; category: string; condition: 'GOOD' | 'VERY_GOOD' | 'EXCELLENT'; isSold: boolean; createdAt: string; }

export const adminApi = {
  getDashboardStats: async () => { const r = await api.get<ApiResponse<DashboardStats>>('/admin/stats'); return r.data; },
  getUsers: async () => { const r = await api.get<ApiResponse<AdminUser[]>>('/admin/users'); return r.data; },
  blockUser: async (id: string) => { const r = await api.put<ApiResponse<AdminUser>>(`/admin/users/${id}/block`); return r.data; },
  unblockUser: async (id: string) => { const r = await api.put<ApiResponse<AdminUser>>(`/admin/users/${id}/unblock`); return r.data; },
  getUserOrders: async (userId: string) => { const r = await api.get<ApiResponse<Order[]>>(`/admin/users/${userId}/orders`); return r.data; },
  deleteUser: async (id: string) => { const r = await api.delete<ApiResponse>(`/admin/users/${id}`); return r.data; },
  getAiUsageSummary: async () => { const r = await api.get<ApiResponse<AiUsageSummary[]>>('/admin/ai-usage'); return r.data; },
  adjustAiCredits: async (userId: string, amount: number) => { const r = await api.put<ApiResponse<{ id: string; aiCredits: number }>>(`/admin/users/${userId}/ai-credits`, { amount }); return r.data; },
  getThriftRequests: async () => { const r = await api.get<ApiResponse<ThriftRequest[]>>('/admin/thrift/requests'); return r.data; },
  updateThriftRequestStatus: async (id: string, status: ThriftRequest['status']) => { const r = await api.put<ApiResponse<ThriftRequest>>(`/admin/thrift/requests/${id}/status`, { status }); return r.data; },
  getRefurbishmentItems: async () => { const r = await api.get<ApiResponse<RefurbishmentItem[]>>('/admin/refurbishment'); return r.data; },
  updateRefurbishmentItem: async (id: string, data: Partial<RefurbishmentItem>) => { const r = await api.put<ApiResponse<RefurbishmentItem>>(`/admin/refurbishment/${id}`, data); return r.data; },
  moveToInventory: async (id: string) => { const r = await api.post<ApiResponse<ThriftInventoryItem>>(`/admin/refurbishment/${id}/move-to-inventory`); return r.data; },
  getThriftInventory: async () => { const r = await api.get<ApiResponse<ThriftInventoryItem[]>>('/admin/thrift/inventory'); return r.data; },
  updateThriftItem: async (id: string, data: Partial<ThriftInventoryItem>) => { const r = await api.put<ApiResponse<ThriftInventoryItem>>(`/admin/thrift/inventory/${id}`, data); return r.data; },
  deleteThriftItem: async (id: string) => { const r = await api.delete<ApiResponse>(`/admin/thrift/inventory/${id}`); return r.data; },
};

// ============================================
// SELLER API
// ============================================

export interface SellerStats { totalProducts: number; totalOrders: number; totalRevenue: number; recentOrders: any[]; }
export interface SellerRevenue { totalRevenue: number; totalOrders: number; revenueByMonth: { month: string; revenue: number }[]; revenueByProduct: { productId: string; productName: string; quantity: number; revenue: number }[]; revenueByCategory: { category: string; count: number; revenue: number }[]; }
export interface SellerOrder { id: string; orderNumber: string; status: string; createdAt: string; updatedAt: string; shippedAt?: string; deliveredAt?: string; paymentMethod: string; paymentStatus: string; total: number; shipping: number; user: { id: string; name: string; email: string; phone?: string }; sellerItems: { id: string; productId: string; productName: string; productImage: string; price: number; quantity: number; size: string; product: { id: string; name: string; images: string[]; sellerId: string }; }[]; }
export type SellerApprovalStatusType = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PRICE_UPDATE_REQUESTED';
export interface AdminSellerProduct extends Product { sellerId: string; seller?: { id: string; name: string; email: string; phone?: string }; sellerPrice?: number; sellerApprovalStatus?: SellerApprovalStatusType; adminNote?: string; }

export const sellerApi = {
  getStats: async () => { const r = await api.get<ApiResponse<SellerStats>>('/seller/stats'); return r.data; },
  getProducts: async (params?: { page?: number; limit?: number; search?: string; gender?: string; category?: string; sortBy?: string }) => { const r = await api.get<PaginatedResponse<Product>>('/seller/products', { params }); return r.data; },
  createProduct: async (formData: FormData) => { const r = await api.post<ApiResponse<Product>>('/seller/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); return r.data; },
  updateProduct: async (id: string, formData: FormData) => { const r = await api.put<ApiResponse<Product>>(`/seller/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); return r.data; },
  deleteProduct: async (id: string) => { const r = await api.delete<ApiResponse>(`/seller/products/${id}`); return r.data; },
  deleteProductImage: async (productId: string, imagePath: string) => { const r = await api.delete<ApiResponse>(`/seller/products/${productId}/images`, { data: { imagePath } }); return r.data; },
  getRevenue: async () => { const r = await api.get<ApiResponse<SellerRevenue>>('/seller/revenue'); return r.data; },
  getOrders: async (params?: { page?: number; limit?: number; status?: string }) => { const r = await api.get<ApiResponse<{ orders: SellerOrder[]; pagination: any }>>('/seller/orders', { params }); return r.data; },
  markOrderShipped: async (orderId: string) => { const r = await api.put<any>(`/seller/orders/${orderId}/ship`); return r.data; },
};

// ============================================
// ADMIN SELLER / BUSINESS API
// ============================================

export interface AdminBusinessUser {
  id: string; name: string; email: string; role: string; isEmailVerified: boolean; createdAt: string; businessCredits: number;
  _count: { businessApiKeys: number; aiUsage: number };
}

export const businessApi = {
  getCredits: async () => { const r = await api.get<ApiResponse<{ credits: number; costPerTask: number }>>('/v1/credits'); return r.data; },
  getUsage: async (params?: { page?: number; limit?: number }) => { const r = await api.get<ApiResponse<{ items: AiUsageItem[]; pagination: any }>>('/v1/usage', { params }); return r.data; },
  getApiKeys: async () => { const r = await api.get<ApiResponse<BusinessApiKey[]>>('/v1/keys'); return r.data; },
  createApiKey: async (name: string) => { const r = await api.post<ApiResponse<{ key: string; name: string; prefix: string }>>('/v1/keys', { name }); return r.data; },
  revokeApiKey: async (id: string) => { const r = await api.delete<ApiResponse>(`/v1/keys/${id}`); return r.data; },
};

export interface BusinessApiKey { id: string; name: string; keyPrefix: string; isActive: boolean; lastUsedAt?: string; createdAt: string; }
export interface AiUsageItem { id: string; userId: string; taskId: string; hdMode: boolean; success: boolean | null; createdAt: string; }

export const adminBusinessApi = {
  getBusinesses: async () => { const r = await api.get<ApiResponse<AdminBusinessUser[]>>('/admin/businesses'); return r.data; },
  adjustCredits: async (id: string, amount: number) => { const r = await api.put<ApiResponse<{ id: string; businessCredits: number }>>(`/admin/businesses/${id}/credits`, { amount }); return r.data; },
  createSeller: async (data: { name: string; email: string; phone?: string; password: string; pickupAddress: { name?: string; companyName?: string; address: string; address2?: string; city: string; state: string; pincode: string; phone: string; email?: string; country?: string } }) => {
    const r = await api.post<ApiResponse<{ id: string; name: string; email: string; role: string; shiprocketCode: string }>>('/admin/users/create-seller', data); return r.data;
  },
  createBusiness: async (data: { name: string; email: string; phone?: string; password: string }) => {
    const r = await api.post<ApiResponse<{ id: string; name: string; email: string; role: string }>>('/admin/users/create-business', data); return r.data;
  },
};

// ============================================
// SHIPPING API (Shiprocket)
// ============================================

export interface PickupAddress { id: string; sellerId: string; name: string; companyName?: string; address: string; address2?: string; city: string; state: string; pincode: string; phone: string; email: string; isDefault: boolean; isActive: boolean; shiprocketCode?: string; createdAt: string; updatedAt: string; }
export interface PickupLocation { id: string; name: string; companyName?: string; address: string; address2?: string; city: string; state: string; pincode: string; phone: string; email: string; isDefault: boolean; shiprocketCode?: string; createdAt: string; updatedAt: string; }
export interface ServiceabilityResult { serviceable: boolean; couriers: { id: number; name: string; rate: number; cod: boolean; estimatedDays: string; etd: string; rating: number; }[]; recommended: { id: number; name: string } | null; }

export const shippingApi = {
  markAsAdminShipment: async (orderId: string) => { const r = await api.post<ApiResponse<any>>('/shipping/mark-admin-shipment', { orderId }); return r.data; },
  checkServiceability: async (data: { deliveryPincode: string; weight?: number; cod?: boolean }) => { const r = await api.post<ApiResponse<ServiceabilityResult>>('/shipping/check-serviceability', data); return r.data; },
  sendToShiprocket: async (orderId: string, data?: { weight?: number; length?: number; breadth?: number; height?: number; courierId?: number }) => { const r = await api.post<ApiResponse<{ order: Order; shipment: any }>>(`/shipping/send-to-shiprocket/${orderId}`, data || {}); return r.data; },
  trackShipment: async (awbCode: string) => { const r = await api.get<ApiResponse<any>>(`/shipping/track/${awbCode}`); return r.data; },
  generateLabel: async (orderId: string) => { const r = await api.post<ApiResponse<{ labelUrl: string; labelCreated: boolean }>>(`/shipping/generate-label/${orderId}`); return r.data; },
  cancelShiprocketShipment: async (orderId: string) => { const r = await api.post<ApiResponse<void>>(`/shipping/cancel/${orderId}`); return r.data; },
};

// ============================================
// SELLER PICKUP ADDRESSES API
// ============================================

export const pickupAddressApi = {
  getMyPickupAddresses: async () => { const r = await api.get<ApiResponse<PickupAddress[]>>('/seller/pickup-addresses'); return r.data; },
  createPickupAddress: async (data: Omit<PickupAddress, 'id' | 'sellerId' | 'isActive' | 'shiprocketCode' | 'createdAt' | 'updatedAt'>) => { const r = await api.post<ApiResponse<PickupAddress>>('/seller/pickup-addresses', data); return r.data; },
  updatePickupAddress: async (id: string, data: Partial<PickupAddress>) => { const r = await api.put<ApiResponse<PickupAddress>>(`/seller/pickup-addresses/${id}`, data); return r.data; },
  deletePickupAddress: async (id: string) => { const r = await api.delete<ApiResponse<void>>(`/seller/pickup-addresses/${id}`); return r.data; },
};

// ============================================
// ADMIN PICKUP LOCATIONS API
// ============================================

export const pickupLocationApi = {
  getLocations: async () => { const r = await api.get<ApiResponse<PickupLocation[]>>('/admin/pickup-locations'); return r.data; },
  createLocation: async (data: Omit<PickupLocation, 'id' | 'shiprocketCode' | 'createdAt' | 'updatedAt'>) => { const r = await api.post<ApiResponse<PickupLocation>>('/admin/pickup-locations', data); return r.data; },
  updateLocation: async (id: string, data: Partial<PickupLocation>) => { const r = await api.put<ApiResponse<PickupLocation>>(`/admin/pickup-locations/${id}`, data); return r.data; },
  deleteLocation: async (id: string) => { const r = await api.delete<ApiResponse<void>>(`/admin/pickup-locations/${id}`); return r.data; },
};

export const adminSellerApi = {
  getRequests: async (params?: { page?: number; limit?: number; status?: string }) => { const r = await api.get<ApiResponse<{ products: AdminSellerProduct[]; pagination: any }>>('/admin/seller-requests', { params }); return r.data; },
  approveProduct: async (id: string, finalPrice: number) => { const r = await api.put<ApiResponse<AdminSellerProduct>>(`/admin/seller-requests/${id}/approve`, { finalPrice }); return r.data; },
  rejectProduct: async (id: string, reason?: string) => { const r = await api.put<ApiResponse<AdminSellerProduct>>(`/admin/seller-requests/${id}/reject`, { reason }); return r.data; },
  getPendingCount: async () => { const r = await api.get<ApiResponse<{ count: number }>>('/admin/seller-requests/pending-count'); return r.data; },
};

// ============================================
// THRIFT API
// ============================================

export type ThriftItemCondition = 'POOR' | 'FAIR' | 'GOOD' | 'VERY_GOOD' | 'LIKE_NEW';
export type ThriftItemStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PICKED_UP' | 'UNDER_REFURBISHMENT' | 'LISTED' | 'SOLD';
export type ThriftListingStatus = 'PENDING' | 'OFFER_SENT' | 'APPROVED' | 'REJECTED' | 'PICKED_UP' | 'COMPLETED';

export interface ThriftItem { id: string; listingId: string; userId: string; name: string; brand?: string; gender: Gender; wearType: WearType; category: ClothingCategory; subCategory?: ClothingSubCategory; size?: string; condition: ThriftItemCondition; description: string; images: string[]; originalPrice?: number; estimatedValue?: number; listedPrice?: number; status: ThriftItemStatus; rejectionReason?: string; adminNotes?: string; listedProductId?: string; createdAt: string; updatedAt: string; user?: { id: string; name: string; email: string }; }
export interface ThriftListing { id: string; userId: string; status: ThriftListingStatus; pickupAddressId?: string; pickupAddress?: Address; pickupDate?: string; pickupSlot?: string; adminNotes?: string; contactRequested?: boolean; items: ThriftItem[]; user?: { id: string; name: string; email: string; phone?: string }; createdAt: string; updatedAt: string; }
export interface ThriftStats { itemsRehomed: number; sellersCount: number; co2SavedKg: number; co2PerItemKg: number; }
export interface ThriftItemFormData { name: string; brand: string; gender: Gender | ''; wearType: WearType | ''; category: ClothingCategory | ''; subCategory: ClothingSubCategory | ''; size: string; condition: ThriftItemCondition | ''; description: string; originalPrice: string; images: File[]; previewUrls: string[]; }

export const thriftApi = {
  getStats: async () => { const r = await api.get<ApiResponse<ThriftStats>>('/thrift/listings/stats'); return r.data; },
  createListing: async (formData: FormData) => { const r = await api.post<ApiResponse<ThriftListing>>('/thrift/listings', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); return r.data; },
  getMyListings: async () => { const r = await api.get<ApiResponse<ThriftListing[]>>('/thrift/listings'); return r.data; },
  getListing: async (id: string) => { const r = await api.get<ApiResponse<ThriftListing>>(`/thrift/listings/${id}`); return r.data; },
  cancelListing: async (id: string) => { const r = await api.delete<ApiResponse>(`/thrift/listings/${id}`); return r.data; },
  respondToOffer: async (id: string, action: 'ACCEPT' | 'DECLINE' | 'CALL') => { const r = await api.post<ApiResponse<ThriftListing>>(`/thrift/listings/${id}/respond`, { action }); return r.data; },
  uploadItemImages: async (listingId: string, itemId: string, files: File[]) => { const fd = new FormData(); files.forEach((f) => fd.append('images', f)); const r = await api.post<ApiResponse<ThriftItem>>(`/thrift/listings/${listingId}/items/${itemId}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); return r.data; },
};

export const adminThriftApi = {
  getAllListings: async (params?: { status?: string; page?: number; limit?: number }) => { const r = await api.get<ApiResponse<ThriftListing[]>>('/admin/thrift/requests', { params }); return r.data; },
  getListing: async (id: string) => { const r = await api.get<ApiResponse<ThriftListing>>(`/admin/thrift/requests/${id}`); return r.data; },
  reviewListing: async (id: string, payload: { decision: 'OFFER' | 'REJECTED'; pickupDate?: string; pickupSlot?: string; adminNotes?: string; items: { id: string; approved: boolean; estimatedValue?: number; rejectionReason?: string }[] }) => { const r = await api.put<ApiResponse<ThriftListing>>(`/admin/thrift/requests/${id}/review`, payload); return r.data; },
  updateOffer: async (id: string, payload: { pickupDate?: string; pickupSlot?: string; adminNotes?: string; items: { id: string; approved: boolean; estimatedValue?: number; rejectionReason?: string }[] }) => { const r = await api.put<ApiResponse<ThriftListing>>(`/admin/thrift/requests/${id}/offer`, payload); return r.data; },
  markPickedUp: async (id: string) => { const r = await api.put<ApiResponse<ThriftListing>>(`/admin/thrift/requests/${id}/pickup`); return r.data; },
  updateItemStatus: async (itemId: string, status: ThriftItemStatus, adminNotes?: string) => { const r = await api.put<ApiResponse<ThriftItem>>(`/admin/thrift/items/${itemId}/status`, { status, adminNotes }); return r.data; },
  listItem: async (itemId: string, payload: { listedPrice: number; description?: string; stock?: number; condition?: string }) => { const r = await api.post<ApiResponse<{ item: ThriftItem; product: Product }>>(`/admin/thrift/items/${itemId}/list`, payload); return r.data; },
  getInventory: async (params?: { status?: string; page?: number; limit?: number }) => { const r = await api.get<ApiResponse<ThriftItem[]>>('/admin/thrift/inventory', { params }); return r.data; },
};

// ============================================
// PAYMENT API
// ============================================

export const paymentApi = {
  initiateOnlinePayment: async (data: { addressId: string; paymentMethod: 'CARD' | 'WALLET'; productIds?: string[]; coinsToUse?: number; couponCode?: string }) => { const r = await api.post<ApiResponse<{ orderId?: string; orderNumber?: string; total: number; razorpayOrderId?: string; receipt?: string; paidWithCoins?: boolean }>>('/payment/initiate', data); return r.data; },
  verifyPayment: async (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; receipt: string }) => { const r = await api.post<ApiResponse<{ orderId: string; orderNumber: string; status: string; paymentStatus: string; total: number }>>('/payment/verify', data); return r.data; },
  getPaymentStatus: async (orderId: string) => { const r = await api.get<ApiResponse<{ orderId: string; orderNumber: string; status: string; paymentStatus: string; total: number }>>(`/payment/status/${orderId}`); return r.data; },
  initiateRefund: async (orderId: string) => { const r = await api.post<ApiResponse<{ refundId: string; amount: number; status: string; speedProcessed: string }>>(`/payment/refund/${orderId}`); return r.data; },
};

// ============================================
// COUPONS API
// ============================================

export type CouponDiscountType = 'PERCENTAGE' | 'FLAT';
export type CouponScope = 'ALL' | 'CATEGORY' | 'PRODUCT';
export type CouponTarget = 'SHOP' | 'THRIFT' | 'BOTH';
export interface Coupon { id: string; code: string; description?: string; discountType: CouponDiscountType; discountValue: number; maxDiscountAmount?: number; minOrderAmount?: number; totalUsageLimit?: number; perUserLimit: number; isFirstOrderOnly: boolean; applicableTo: CouponTarget; scope: CouponScope; applicableGenders: string[]; applicableWearTypes: string[]; applicableCategories: string[]; isActive: boolean; startsAt?: string; expiresAt?: string; usageCount: number; createdAt: string; updatedAt: string; _count?: { usages: number; products: number; blockedUsers: number }; }
export interface CouponValidationResult { coupon: { id: string; code: string; discountType: CouponDiscountType; discountValue: number; description?: string }; discountAmount: number; eligibleItemsCount: number; }

export const couponsApi = {
  validateCoupon: async (data: { couponCode: string; productIds?: string[] }) => { const r = await api.post<ApiResponse<CouponValidationResult>>('/coupons/validate', data); return r.data; },
  listCoupons: async (params?: { page?: number; limit?: number; isActive?: boolean; search?: string }) => { const r = await api.get<ApiResponse<{ coupons: Coupon[]; pagination: any }>>('/coupons/admin', { params }); return r.data; },
  getCoupon: async (id: string) => { const r = await api.get<ApiResponse<Coupon>>(`/coupons/admin/${id}`); return r.data; },
  createCoupon: async (data: Partial<Coupon> & { productIds?: string[] }) => { const r = await api.post<ApiResponse<Coupon>>('/coupons/admin', data); return r.data; },
  updateCoupon: async (id: string, data: Partial<Coupon> & { productIds?: string[] }) => { const r = await api.put<ApiResponse<Coupon>>(`/coupons/admin/${id}`, data); return r.data; },
  deleteCoupon: async (id: string) => { const r = await api.delete<ApiResponse>(`/coupons/admin/${id}`); return r.data; },
  getCouponUsages: async (id: string) => { const r = await api.get<ApiResponse<any[]>>(`/coupons/admin/${id}/usages`); return r.data; },
  blockUser: async (couponId: string, userId: string) => { const r = await api.post<ApiResponse>(`/coupons/admin/${couponId}/block-user`, { userId }); return r.data; },
  unblockUser: async (couponId: string, userId: string) => { const r = await api.delete<ApiResponse>(`/coupons/admin/${couponId}/block-user/${userId}`); return r.data; },
  resetUsageCount: async (couponId: string) => { const r = await api.post<ApiResponse>(`/coupons/admin/${couponId}/reset-usage`); return r.data; },
};

// ============================================
// RETURNS API
// ============================================

export type ReturnType = 'RETURN' | 'REPLACEMENT';
export type ReturnReason = 'DAMAGED' | 'WRONG_ITEM' | 'SIZE_ISSUE' | 'QUALITY_ISSUE' | 'OTHER';
export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'ITEM_RECEIVED' | 'REFUND_INITIATED' | 'REPLACEMENT_SHIPPED' | 'COMPLETED' | 'CANCELLED';
export interface ReturnRequestItem { id: string; returnRequestId: string; orderItemId: string; quantity: number; orderItem: OrderItem; }
export interface ReturnRequest { id: string; requestNumber: string; orderId: string; userId: string; type: ReturnType; status: ReturnStatus; reason: ReturnReason; description?: string; images: string[]; replacementSize?: string; bankAccountName?: string; bankAccountNumber?: string; bankIFSC?: string; upiHandle?: string; adminNote?: string; resolvedAt?: string; createdAt: string; updatedAt: string; items: ReturnRequestItem[]; order?: { orderNumber: string; total: number; status: string; paymentMethod: string }; user?: { id: string; name: string; email: string }; }
export interface CreateReturnRequestPayload { orderId: string; type: ReturnType; reason: ReturnReason; description?: string; images?: string[]; replacementSize?: string; bankAccountName?: string; bankAccountNumber?: string; bankIFSC?: string; upiHandle?: string; items: { orderItemId: string; quantity: number }[]; }

export const returnsApi = {
  createRequest: async (data: CreateReturnRequestPayload) => { const r = await api.post<ApiResponse<ReturnRequest>>('/returns', data); return r.data; },
  getMyRequests: async () => { const r = await api.get<ApiResponse<ReturnRequest[]>>('/returns'); return r.data; },
  getRequestById: async (id: string) => { const r = await api.get<ApiResponse<ReturnRequest>>(`/returns/${id}`); return r.data; },
  cancelRequest: async (id: string) => { const r = await api.delete<ApiResponse<ReturnRequest>>(`/returns/${id}`); return r.data; },
  adminGetAll: async (params?: { status?: string; type?: string; page?: number; limit?: number }) => { const r = await api.get<ApiResponse<{ requests: ReturnRequest[]; pagination: any }>>('/returns/admin/all', { params }); return r.data; },
  adminUpdateStatus: async (id: string, data: { status: ReturnStatus; adminNote?: string }) => { const r = await api.patch<ApiResponse<ReturnRequest>>(`/returns/admin/${id}`, data); return r.data; },
};

// ============================================
// COINS API
// ============================================

export const coinsApi = {
  getHistory: async () => { const r = await api.get<ApiResponse<{ coinBalance: number; transactions: CoinTransaction[] }>>('/coins/history'); return r.data; },
  adminAdjust: async (userId: string, amount: number, description: string) => { const r = await api.put<ApiResponse<{ id: string; coinBalance: number }>>(`/admin/users/${userId}/coins`, { amount, description }); return r.data; },
};

// ============================================
// AI CREDITS API
// ============================================

export const creditsApi = {
  getPacks: async () => { const r = await api.get<ApiResponse<AiCreditPack[]>>('/credits/packs'); return r.data; },
  getBalance: async () => { const r = await api.get<ApiResponse<{ aiCredits: number; aiTryOnCount: number }>>('/credits/balance'); return r.data; },
  getPurchaseHistory: async () => { const r = await api.get<ApiResponse<AiCreditPurchase[]>>('/credits/purchases'); return r.data; },
  initiatePurchase: async (packId: string) => { const r = await api.post<ApiResponse<{ purchaseId: string; credits: number; amount: number; redirectUrl: string }>>('/credits/purchase/initiate', { packId }); return r.data; },
  getPurchaseStatus: async (purchaseId: string) => { const r = await api.get<ApiResponse<{ purchase: AiCreditPurchase; aiCredits: number }>>(`/credits/purchase/status/${purchaseId}`); return r.data; },
};

// ============================================
// REVIEWS
// ============================================

export interface Review { id: string; userId: string; author: string; rating: number; title?: string; comment: string; images: string[]; helpfulCount: number; markedHelpful: boolean; createdAt: string; updatedAt: string; }
export interface ReviewStats { averageRating: number; totalReviews: number; distribution: { stars: number; count: number }[]; }
export interface ReviewsResponse { reviews: Review[]; pagination: { page: number; limit: number; total: number; totalPages: number }; stats: ReviewStats; }

export const reviewsApi = {
  getProductReviews: async (productId: string, page = 1, limit = 10) => { const r = await api.get<ApiResponse<ReviewsResponse>>(`/reviews/${productId}`, { params: { page, limit } }); return r.data; },
  getMyReview: async (productId: string) => { const r = await api.get<ApiResponse<Review | null>>(`/reviews/${productId}/my`); return r.data; },
  canReview: async (productId: string) => { const r = await api.get<ApiResponse<{ canReview: boolean }>>(`/reviews/${productId}/can-review`); return r.data; },
  createOrUpdateReview: async (productId: string, data: { rating: number; title?: string; comment: string; images?: File[] }) => { const fd = new FormData(); fd.append('rating', String(data.rating)); fd.append('comment', data.comment); if (data.title) fd.append('title', data.title); (data.images || []).forEach((img) => fd.append('images', img)); const r = await api.post<ApiResponse<Review>>(`/reviews/${productId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); return r.data; },
  deleteReview: async (reviewId: string) => { const r = await api.delete<ApiResponse<null>>(`/reviews/${reviewId}/delete`); return r.data; },
  toggleHelpful: async (reviewId: string) => { const r = await api.post<ApiResponse<{ marked: boolean }>>(`/reviews/${reviewId}/helpful`); return r.data; },
};

// ============================================
// FITVERSE AI
// ============================================

export type FitverseAiClothesType = 'upper' | 'lower' | 'full';
export type FitverseAiTryOnType = 'upper' | 'lower' | 'combo' | 'full_set';
export interface FitverseAiModelCheck { is_good: boolean; error_code?: string; good_clothes_types: FitverseAiClothesType[]; }
export interface FitverseAiClothesCheck { clothes_type: FitverseAiClothesType; is_clothes: boolean; }
export interface FitverseAiTaskStatus { task_id: string; status: 'CREATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'; progress?: number; result_url?: string; error?: string; created_at?: number; started_at?: number; completed_at?: number; }
export interface FitverseAiModel { id: string; name: string; gender: 'MALE' | 'FEMALE' | 'OTHER'; imageUrl: string; status: 'PENDING' | 'VERIFIED' | 'REJECTED'; goodClothesTypes: FitverseAiClothesType[]; note?: string | null; createdAt: string; }

export const fitverseAiApi = {
  getModels: async () => { const r = await api.get<ApiResponse<FitverseAiModel[]>>('/fitverse-ai/models'); return r.data; },
  createModel: async (file: File, name: string, gender: FitverseAiModel['gender']) => { const fd = new FormData(); fd.append('name', name); fd.append('gender', gender); fd.append('model_image', file); const r = await api.post<ApiResponse<{ check: FitverseAiModelCheck; model: FitverseAiModel | null }>>('/fitverse-ai/models', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); return r.data; },
  deleteModel: async (id: string) => { const r = await api.delete<ApiResponse<null>>(`/fitverse-ai/models/${id}`); return r.data; },
  checkModel: async (file: File) => { const fd = new FormData(); fd.append('input_image', file); const r = await api.post<ApiResponse<FitverseAiModelCheck>>('/fitverse-ai/model/check', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); return r.data; },
  checkClothes: async (file: File) => { const fd = new FormData(); fd.append('input_image', file); const r = await api.post<ApiResponse<FitverseAiClothesCheck>>('/fitverse-ai/clothes/check', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); return r.data; },
  createTryOnTask: async (payload: { modelImage: File; clothType: FitverseAiTryOnType; clothImage?: File; lowerClothImage?: File; hdMode?: boolean }) => { const fd = new FormData(); fd.append('model_image', payload.modelImage); if (payload.clothImage) fd.append('cloth_image', payload.clothImage); if (payload.lowerClothImage) fd.append('lower_cloth_image', payload.lowerClothImage); fd.append('cloth_type', payload.clothType); if (payload.hdMode) fd.append('hd_mode', 'true'); const r = await api.post<ApiResponse<{ task_id: string; status: string }>>('/fitverse-ai/tryon', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); return r.data; },
  getTryOnStatus: async (taskId: string) => { const r = await api.get<ApiResponse<FitverseAiTaskStatus>>(`/fitverse-ai/tryon/${taskId}`); return r.data; },
  getTryOnResult: async (taskId: string) => { const r = await api.get(`/fitverse-ai/tryon/${taskId}/result`, { responseType: 'blob' }); return r.data as Blob; },
};

// Export everything
export default api;