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

// ============================================
// PRODUCT VALIDATION
// ============================================

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
  stock: Joi.number().integer().min(0).required().messages({
    'number.base': 'Stock must be a number',
    'number.integer': 'Stock must be an integer',
    'number.min': 'Stock cannot be negative',
  }),
  category: Joi.string().valid('MENS', 'WOMENS', 'ACCESSORIES', 'ACTIVEWEAR', 'FOOTWEAR', 'THRIFT').required().messages({
    'any.only': 'Invalid category',
    'any.required': 'Category is required',
  }),
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(3).max(200).optional(),
  description: Joi.string().min(10).optional(),
  price: Joi.number().positive().precision(2).optional(),
  stock: Joi.number().integer().min(0).optional(),
  category: Joi.string().valid('MENS', 'WOMENS', 'ACCESSORIES', 'ACTIVEWEAR', 'FOOTWEAR', 'THRIFT').optional(),
  isActive: Joi.boolean().optional(),
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
  paymentMethod: Joi.string().valid('CARD', 'COD', 'WALLET').required().messages({
    'any.only': 'Invalid payment method',
    'any.required': 'Payment method is required',
  }),
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

module.exports = {
  // Auth
  signupSchema,
  loginSchema,
  verifyOTPSchema,
  resendOTPSchema,
  
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
};
