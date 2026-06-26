// Environment Configuration with Validation
// Ensures all required environment variables are present

const dotenv = require('dotenv');
const path = require('path');

// Load environment-specific .env file
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';

const envPath = path.resolve(__dirname, '../../', envFile);
dotenv.config({ path: envPath });

// Required environment variables
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_URL',
];

const normalizeEnvValue = (value) => {
  if (typeof value !== 'string') return value;
  return value.trim();
};

const normalizeUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  let url = value.trim();
  if (!url) return '';

  // Recover common typo: https//example.com (missing colon)
  if (/^https\/\//i.test(url)) {
    url = `https://${url.slice('https//'.length)}`;
  }
  if (/^http\/\//i.test(url)) {
    url = `http://${url.slice('http//'.length)}`;
  }

  if (!/^https?:\/\//i.test(url)) return '';
  return url.replace(/\/+$/, '');
};

const parseFrontendOrigins = (rawValue) => {
  const origins = String(rawValue || '')
    .split(',')
    .map((item) => normalizeUrl(item))
    .filter(Boolean);

  return Array.from(new Set(origins));
};

// Validate required environment variables
const validateEnv = () => {
  const missing = requiredEnvVars.filter((varName) => {
    const raw = process.env[varName];
    const normalized = normalizeEnvValue(raw);
    return !normalized || normalized === '""' || normalized === "''";
  });
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease check your .env file and try again.');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated successfully');
};

validateEnv();

const frontendOrigins = parseFrontendOrigins(process.env.FRONTEND_URL);
const frontendPrimaryUrl = frontendOrigins[0] || 'http://localhost:5173';

// Export configuration object
const config = {
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || 5000,
  
  database: {
    url: normalizeEnvValue(process.env.DATABASE_URL),
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  frontend: {
    url: process.env.FRONTEND_URL,
    origins: frontendOrigins,
    primaryUrl: frontendPrimaryUrl,
  },
  
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 5,
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880, // 5MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 5000,
  },

  server: {
    requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS, 10) || 120000,
    headersTimeoutMs: parseInt(process.env.HEADERS_TIMEOUT_MS, 10) || 125000,
    keepAliveTimeoutMs: parseInt(process.env.KEEP_ALIVE_TIMEOUT_MS, 10) || 60000,
    routeTimeoutMs: parseInt(process.env.ROUTE_TIMEOUT_MS, 10) || 120000,
    slowRequestMs: parseInt(process.env.SLOW_REQUEST_MS, 10) || 5000,
  },

  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || 'Fitverse <noreply@contact.fitverse.co.in>',
    logoUrl: process.env.EMAIL_LOGO_URL || `${frontendPrimaryUrl}/logo_white.png`,
    logoUrlBlack: process.env.EMAIL_LOGO_URL_BLACK || `${frontendPrimaryUrl}/logo_black.png`,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  fitverseAi: {
    apiKey: process.env.FITVERSE_API_KEY,
    baseUrl: normalizeUrl(process.env.FITVERSE_AI_BASE_URL),
  },
  shiprocket: {
    email: process.env.SHIPROCKET_EMAIL,
    password: process.env.SHIPROCKET_PASSWORD,
    webhookToken: process.env.SHIPROCKET_WEBHOOK_TOKEN || '',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
};

module.exports = config;
