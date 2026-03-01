// API Service Layer - Axios instance with interceptors and all backend endpoints

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

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
    // Handle unauthorized errors
    if (error.response?.status === 401) {
      // Don't redirect if we're already on the login page (to preserve form state)
      // or if the error is from the login endpoint itself (invalid credentials)
      const isOnLoginPage = window.location.pathname === '/login';
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      // Don't redirect for /auth/me — used by AuthContext on page load to check
      // if a stored token is still valid; a 401 there just means "not logged in"
      const isGetMeRequest = error.config?.url?.includes('/auth/me');
      
      if (!isOnLoginPage && !isLoginRequest && !isGetMeRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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
  role: 'USER' | 'ADMIN';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
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
  errors?: Array<{ field: string; message: string }>;
}

export interface LoginResponse {
  user: User;
  token: string;
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
  stock: number;
  brand?: string;
  gender: Gender;
  wearType: WearType;
  category: ClothingCategory;
  subCategory?: ClothingSubCategory;
  availableSizes: string[];
  isThrift: boolean;
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  addressId: string;
  paymentMethod: 'CARD' | 'COD' | 'WALLET';
  paymentStatus: string;
  paymentId?: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
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
  // Sign up
  signup: async (data: { name: string; email: string; password: string; phone?: string }) => {
    const response = await api.post<ApiResponse<User>>('/auth/signup', data);
    return response.data;
  },

  // Verify email with OTP
  verifyEmail: async (data: { email: string; otp: string }) => {
    const response = await api.post<ApiResponse>('/auth/verify-email', data);
    return response.data;
  },

  // Login
  login: async (data: { email: string; password: string }) => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
    if (response.data.success && response.data.data) {
      // Store token and user
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  // Resend OTP
  resendOtp: async (data: { email: string }) => {
    const response = await api.post<ApiResponse>('/auth/resend-otp', data);
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },

  // Change password
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await api.put<ApiResponse>('/auth/change-password', data);
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get stored user
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};

// ============================================
// PRODUCTS API
// ============================================

export const productsApi = {
  // Get all products (with filters and pagination)
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    gender?: string;
    wearType?: string;
    category?: string;
    subCategory?: string;
    size?: string;
    isThrift?: boolean;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sortBy?: string;
  }) => {
    const response = await api.get<PaginatedResponse<Product>>('/products', { params });
    return response.data;
  },

  // Get single product
  getProduct: async (id: string) => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },

  // Create product (admin only)
  createProduct: async (formData: FormData) => {
    const response = await api.post<ApiResponse<Product>>('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update product (admin only)
  updateProduct: async (id: string, formData: FormData) => {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete product (admin only)
  deleteProduct: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/products/${id}`);
    return response.data;
  },
};

// ============================================
// CART API
// ============================================

export const cartApi = {
  // Get cart
  getCart: async () => {
    const response = await api.get<ApiResponse<Cart>>('/cart');
    return response.data;
  },

  // Add to cart
  addToCart: async (data: { productId: string; quantity: number; size?: string }) => {
    const response = await api.post<ApiResponse<Cart>>('/cart', data);
    return response.data;
  },

  // Update cart item quantity
  updateCartItem: async (itemId: string, data: { quantity: number }) => {
    const response = await api.put<ApiResponse<Cart>>(`/cart/${itemId}`, data);
    return response.data;
  },

  // Remove from cart
  removeFromCart: async (itemId: string) => {
    const response = await api.delete<ApiResponse<Cart>>(`/cart/${itemId}`);
    return response.data;
  },

  // Clear cart
  clearCart: async () => {
    const response = await api.delete<ApiResponse>('/cart');
    return response.data;
  },
};

// ============================================
// ORDERS API
// ============================================

export const ordersApi = {
  // Create order
  createOrder: async (data: { addressId: string; paymentMethod: 'CARD' | 'COD' | 'WALLET'; productIds?: string[] }) => {
    const response = await api.post<ApiResponse<Order>>('/orders', data);
    return response.data;
  },

  // Get my orders
  getMyOrders: async (status?: string) => {
    const response = await api.get<ApiResponse<Order[]>>('/orders', {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  // Get single order
  getOrder: async (id: string) => {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data;
  },

  // Cancel order
  cancelOrder: async (id: string) => {
    const response = await api.put<ApiResponse<Order>>(`/orders/${id}/cancel`);
    return response.data;
  },

  // Track order by order number + email (public)
  trackOrder: async (orderNumber: string, email: string) => {
    const response = await api.get<ApiResponse<any>>('/orders/track', {
      params: { orderNumber, email },
    });
    return response.data;
  },

  // Get all orders (admin only)
  getAllOrders: async () => {
    const response = await api.get<ApiResponse<Order[]>>('/orders/admin/all');
    return response.data;
  },

  // Update order status (admin only)
  updateOrderStatus: async (id: string, data: { status: string }) => {
    const response = await api.put<ApiResponse<Order>>(`/orders/${id}/status`, data);
    return response.data;
  },
};

// ============================================
// ADDRESSES API
// ============================================

export const addressesApi = {
  // Get all addresses
  getAddresses: async () => {
    const response = await api.get<ApiResponse<Address[]>>('/addresses');
    return response.data;
  },

  // Get single address
  getAddress: async (id: string) => {
    const response = await api.get<ApiResponse<Address>>(`/addresses/${id}`);
    return response.data;
  },

  // Create address
  createAddress: async (data: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<ApiResponse<Address>>('/addresses', data);
    return response.data;
  },

  // Update address
  updateAddress: async (id: string, data: Partial<Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    const response = await api.put<ApiResponse<Address>>(`/addresses/${id}`, data);
    return response.data;
  },

  // Delete address
  deleteAddress: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/addresses/${id}`);
    return response.data;
  },
};

// ============================================
// ADMIN API
// ============================================

export interface AdminUser extends User {
  _count?: { orders: number };
  isBlocked?: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  monthlyRevenue: number;
  thriftRequestCount: number;
  aiTryOnCount: number;
  revenueByMonth: { month: string; revenue: number }[];
  recentOrders: Order[];
}

export interface ThriftRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  address: string;
  pickupDate: string;
  pickupTime: string;
  itemDescription: string;
  images: string[];
  status: 'PENDING' | 'PICKED_UP' | 'UNDER_REFURBISHMENT' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface RefurbishmentItem {
  id: string;
  thriftRequestId: string;
  itemName: string;
  originalImages: string[];
  refurbishedImages: string[];
  notes: string;
  cost: number;
  finalPrice: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'IN_INVENTORY';
  createdAt: string;
  updatedAt: string;
}

export interface ThriftInventoryItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
  condition: 'GOOD' | 'VERY_GOOD' | 'EXCELLENT';
  isSold: boolean;
  createdAt: string;
}

export interface AIStats {
  totalRequests: number;
  requestsToday: number;
  avgProcessingTimeMs: number;
  successRate: number;
  errorCount: number;
  isMaintenanceMode: boolean;
  requestsByDay: { date: string; count: number }[];
  recentErrors: { timestamp: string; message: string; userId?: string }[];
}

export const adminApi = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await api.get<ApiResponse<DashboardStats>>('/admin/stats');
    return response.data;
  },

  // Users
  getUsers: async () => {
    const response = await api.get<ApiResponse<AdminUser[]>>('/admin/users');
    return response.data;
  },

  blockUser: async (id: string) => {
    const response = await api.put<ApiResponse<AdminUser>>(`/admin/users/${id}/block`);
    return response.data;
  },

  unblockUser: async (id: string) => {
    const response = await api.put<ApiResponse<AdminUser>>(`/admin/users/${id}/unblock`);
    return response.data;
  },

  getUserOrders: async (userId: string) => {
    const response = await api.get<ApiResponse<Order[]>>(`/admin/users/${userId}/orders`);
    return response.data;
  },

  // Thrift Requests
  getThriftRequests: async () => {
    const response = await api.get<ApiResponse<ThriftRequest[]>>('/admin/thrift/requests');
    return response.data;
  },

  updateThriftRequestStatus: async (id: string, status: ThriftRequest['status']) => {
    const response = await api.put<ApiResponse<ThriftRequest>>(`/admin/thrift/requests/${id}/status`, { status });
    return response.data;
  },

  // Refurbishment
  getRefurbishmentItems: async () => {
    const response = await api.get<ApiResponse<RefurbishmentItem[]>>('/admin/refurbishment');
    return response.data;
  },

  updateRefurbishmentItem: async (id: string, data: Partial<RefurbishmentItem>) => {
    const response = await api.put<ApiResponse<RefurbishmentItem>>(`/admin/refurbishment/${id}`, data);
    return response.data;
  },

  moveToInventory: async (id: string) => {
    const response = await api.post<ApiResponse<ThriftInventoryItem>>(`/admin/refurbishment/${id}/move-to-inventory`);
    return response.data;
  },

  // Thrift Inventory
  getThriftInventory: async () => {
    const response = await api.get<ApiResponse<ThriftInventoryItem[]>>('/admin/thrift/inventory');
    return response.data;
  },

  updateThriftItem: async (id: string, data: Partial<ThriftInventoryItem>) => {
    const response = await api.put<ApiResponse<ThriftInventoryItem>>(`/admin/thrift/inventory/${id}`, data);
    return response.data;
  },

  deleteThriftItem: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/admin/thrift/inventory/${id}`);
    return response.data;
  },

  // AI Monitoring
  getAIStats: async () => {
    const response = await api.get<ApiResponse<AIStats>>('/admin/ai/stats');
    return response.data;
  },

  toggleAIMaintenanceMode: async (enabled: boolean) => {
    const response = await api.put<ApiResponse>('/admin/ai/maintenance', { enabled });
    return response.data;
  },
};

// ============================================
// THRIFT MARKETPLACE — User-facing types + API
// ============================================

export type ThriftItemCondition = 'POOR' | 'FAIR' | 'GOOD' | 'VERY_GOOD' | 'LIKE_NEW';
export type ThriftItemStatus =
  | 'PENDING' | 'APPROVED' | 'REJECTED'
  | 'PICKED_UP' | 'UNDER_REFURBISHMENT' | 'LISTED' | 'SOLD';
export type ThriftListingStatus =
  | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PICKED_UP' | 'COMPLETED';

export interface ThriftItem {
  id: string;
  listingId: string;
  userId: string;
  name: string;
  brand?: string;
  gender: Gender;
  wearType: WearType;
  category: ClothingCategory;
  subCategory?: ClothingSubCategory;
  size?: string;
  condition: ThriftItemCondition;
  description: string;
  images: string[];
  originalPrice?: number;
  estimatedValue?: number;
  listedPrice?: number;
  status: ThriftItemStatus;
  rejectionReason?: string;
  adminNotes?: string;
  listedProductId?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string };
}

export interface ThriftListing {
  id: string;
  userId: string;
  status: ThriftListingStatus;
  pickupAddressId?: string;
  pickupAddress?: Address;
  pickupDate?: string;
  pickupSlot?: string;
  adminNotes?: string;
  items: ThriftItem[];
  user?: { id: string; name: string; email: string; phone?: string };
  createdAt: string;
  updatedAt: string;
}

export interface ThriftItemFormData {
  name: string;
  brand: string;
  gender: Gender | '';
  wearType: WearType | '';
  category: ClothingCategory | '';
  subCategory: ClothingSubCategory | '';
  size: string;
  condition: ThriftItemCondition | '';
  description: string;
  originalPrice: string;
  images: File[];
  previewUrls: string[];
}

export const thriftApi = {
  // Submit a new listing with multiple items (+ optional images)
  createListing: async (formData: FormData) => {
    const response = await api.post<ApiResponse<ThriftListing>>('/thrift/listings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Get user's own listings
  getMyListings: async () => {
    const response = await api.get<ApiResponse<ThriftListing[]>>('/thrift/listings');
    return response.data;
  },

  // Get single listing detail
  getListing: async (id: string) => {
    const response = await api.get<ApiResponse<ThriftListing>>(`/thrift/listings/${id}`);
    return response.data;
  },

  // Cancel a pending listing
  cancelListing: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/thrift/listings/${id}`);
    return response.data;
  },

  // Upload images for a specific item (after listing created)
  uploadItemImages: async (listingId: string, itemId: string, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    const response = await api.post<ApiResponse<ThriftItem>>(
      `/thrift/listings/${listingId}/items/${itemId}/images`,
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },
};

// Admin thrift API extensions
export const adminThriftApi = {
  // All listing requests
  getAllListings: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse<ThriftListing[]>>('/admin/thrift/requests', { params });
    return response.data;
  },

  getListing: async (id: string) => {
    const response = await api.get<ApiResponse<ThriftListing>>(`/admin/thrift/requests/${id}`);
    return response.data;
  },

  // Review: approve/reject, set pickup date + per-item estimated values
  reviewListing: async (
    id: string,
    payload: {
      decision: 'APPROVED' | 'REJECTED';
      pickupDate?: string;
      pickupSlot?: string;
      adminNotes?: string;
      items: { id: string; approved: boolean; estimatedValue?: number; rejectionReason?: string }[];
    }
  ) => {
    const response = await api.put<ApiResponse<ThriftListing>>(
      `/admin/thrift/requests/${id}/review`,
      payload
    );
    return response.data;
  },

  // Mark listing + items as PICKED_UP
  markPickedUp: async (id: string) => {
    const response = await api.put<ApiResponse<ThriftListing>>(
      `/admin/thrift/requests/${id}/pickup`
    );
    return response.data;
  },

  // Move individual item through pipeline
  updateItemStatus: async (itemId: string, status: ThriftItemStatus, adminNotes?: string) => {
    const response = await api.put<ApiResponse<ThriftItem>>(
      `/admin/thrift/items/${itemId}/status`,
      { status, adminNotes }
    );
    return response.data;
  },

  // List item as a real product in the store
  listItem: async (itemId: string, payload: { listedPrice: number; description?: string; stock?: number }) => {
    const response = await api.post<ApiResponse<{ item: ThriftItem; product: Product }>>(
      `/admin/thrift/items/${itemId}/list`,
      payload
    );
    return response.data;
  },

  // Get listed/sold thrift inventory
  getInventory: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse<ThriftItem[]>>('/admin/thrift/inventory', { params });
    return response.data;
  },
};

// Export everything
export default api;
