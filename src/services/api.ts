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
      
      if (!isOnLoginPage && !isLoginRequest) {
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

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: 'MENS' | 'WOMENS' | 'ACCESSORIES' | 'ACTIVEWEAR' | 'FOOTWEAR' | 'THRIFT';
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
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
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
  addToCart: async (data: { productId: string; quantity: number }) => {
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
  createOrder: async (data: { addressId: string; paymentMethod: 'CARD' | 'COD' | 'WALLET' }) => {
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

// Export everything
export default api;
