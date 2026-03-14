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

// Validate required environment variables
const validateEnv = () => {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease check your .env file and try again.');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated successfully');
};

validateEnv();

// Export configuration object
const config = {
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || 5000,
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  frontend: {
    url: process.env.FRONTEND_URL,
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

  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || 'Fitverse <noreply@contact.fitverse.co.in>',
    logoUrl: process.env.EMAIL_LOGO_URL || `${process.env.FRONTEND_URL}/logo_white.png`,
    logoUrlBlack: process.env.EMAIL_LOGO_URL_BLACK || `${process.env.FRONTEND_URL}/logo_black.png`,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  phonepe: {
    clientId: process.env.PHONEPE_CLIENT_ID,
    clientSecret: process.env.PHONEPE_CLIENT_SECRET,
    clientVersion: parseInt(process.env.PHONEPE_CLIENT_VERSION, 10) || 1,
    // 'SANDBOX' for UAT testing | 'PRODUCTION' when live
    env: process.env.PHONEPE_ENV || 'SANDBOX',
    // Webhook credentials configured in PhonePe Business Dashboard
    webhookUsername: process.env.PHONEPE_WEBHOOK_USERNAME,
    webhookPassword: process.env.PHONEPE_WEBHOOK_PASSWORD,
  },
};

module.exports = config;
