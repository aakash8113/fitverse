# Fitverse Backend API Testing Guide

## 🚀 Server Status
Server running at: `http://localhost:5000`

## 🔑 Test Credentials

### Admin Account
- **Email**: admin@fitverse.com
- **Password**: admin123

### Test Users
- **User 1**: john@example.com / user123
- **User 2**: jane@example.com / user123

---

## 📝 API Endpoints Testing

### 1. Authentication Flow

#### Signup (Create New User)
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"test123\",\"phone\":\"+1234567890\"}"
```

**Expected Response**:
- Status: 201 Created
- Body: User object with `isEmailVerified: false`
- Console: OTP will be printed (check server console logs)

---

#### Verify Email
```bash
# Use the OTP from server console
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"otp\":\"<USE_CURRENT_OTP>\"}"
```

**Expected Response**:
- Status: 200 OK
- Message: "Email verified successfully"

---

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@fitverse.com\",\"password\":\"admin123\"}"
```

**Expected Response**:
- Status: 200 OK
- Body: User object + `token` (JWT)
- **SAVE THIS TOKEN** for subsequent requests

---

#### Get Current User
```bash
# Replace <TOKEN> with the JWT from login
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

---

### 2. Product Management

#### Get All Products (Public)
```bash
curl -X GET "http://localhost:5000/api/products?page=1&limit=10&category=MENS&minPrice=0&maxPrice=100"
```

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 10)
- `category` (MENS, WOMENS, ACCESSORIES, ACTIVEWEAR, FOOTWEAR, THRIFT)
- `minPrice`
- `maxPrice`
- `search` (search by product name)

---

#### Get Single Product
```bash
curl -X GET http://localhost:5000/api/products/1
```

---

#### Create Product (Admin Only)
```bash
# Admin token required
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -F "name=New Product" \
  -F "description=Product Description" \
  -F "price=99.99" \
  -F "stock=50" \
  -F "category=MENS" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

**Note**: Use form-data for file uploads (max 5 images)

---

#### Update Product (Admin Only)
```bash
curl -X PUT http://localhost:5000/api/products/1 \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -F "name=Updated Name" \
  -F "price=89.99"
```

---

#### Delete Product (Admin Only)
```bash
curl -X DELETE http://localhost:5000/api/products/1 \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

### 3. Cart Management

#### Get Cart
```bash
# User must be logged in + email verified
curl -X GET http://localhost:5000/api/cart \
  -H "Authorization: Bearer <USER_TOKEN>"
```

---

#### Add to Cart
```bash
curl -X POST http://localhost:5000/api/cart \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"productId\":1,\"quantity\":2}"
```

---

#### Update Cart Item Quantity
```bash
curl -X PUT http://localhost:5000/api/cart/1 \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"quantity\":5}"
```

---

#### Remove from Cart
```bash
curl -X DELETE http://localhost:5000/api/cart/1 \
  -H "Authorization: Bearer <USER_TOKEN>"
```

---

#### Clear Cart
```bash
curl -X DELETE http://localhost:5000/api/cart \
  -H "Authorization: Bearer <USER_TOKEN>"
```

---

### 4. Address Management

#### Get All Addresses
```bash
curl -X GET http://localhost:5000/api/addresses \
  -H "Authorization: Bearer <USER_TOKEN>"
```

---

#### Create Address
```bash
curl -X POST http://localhost:5000/api/addresses \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"John Doe\",\"phone\":\"+1234567890\",\"addressLine1\":\"123 Main St\",\"city\":\"New York\",\"state\":\"NY\",\"zipCode\":\"10001\",\"country\":\"United States\",\"isDefault\":true}"
```

---

#### Update Address
```bash
curl -X PUT http://localhost:5000/api/addresses/1 \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"city\":\"Los Angeles\",\"state\":\"CA\"}"
```

---

#### Delete Address
```bash
curl -X DELETE http://localhost:5000/api/addresses/1 \
  -H "Authorization: Bearer <USER_TOKEN>"
```

---

### 5. Order Management

#### Create Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"addressId\":1,\"paymentMethod\":\"COD\"}"
```

**Payment Methods**: `CARD`, `COD`, `WALLET`

**Note**: 
- Cart must have items
- Address must exist and belong to user
- Product stock will be automatically reduced
- Cart will be cleared after successful order
- For CARD payment, check server console for payment verification logs

---

#### Get My Orders
```bash
# Optional: Filter by status
curl -X GET "http://localhost:5000/api/orders?status=PENDING" \
  -H "Authorization: Bearer <USER_TOKEN>"
```

**Order Statuses**: `PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED`

---

#### Get Single Order
```bash
curl -X GET http://localhost:5000/api/orders/1 \
  -H "Authorization: Bearer <USER_TOKEN>"
```

---

#### Cancel Order
```bash
curl -X PUT http://localhost:5000/api/orders/1/cancel \
  -H "Authorization: Bearer <USER_TOKEN>"
```

**Note**: Stock will be restored automatically

---

#### Get All Orders (Admin Only)
```bash
curl -X GET http://localhost:5000/api/orders/admin/all \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

#### Update Order Status (Admin Only)
```bash
curl -X PUT http://localhost:5000/api/orders/1/status \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"SHIPPED\"}"
```

---

## 🧪 Complete Testing Flow

### Step 1: Admin Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fitverse.com","password":"admin123"}'
```
Save the token as `ADMIN_TOKEN`

---

### Step 2: User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"user123"}'
```
Save the token as `USER_TOKEN`

---

### Step 3: Browse Products
```bash
curl -X GET "http://localhost:5000/api/products?page=1&limit=5"
```

---

### Step 4: Add Products to Cart
```bash
curl -X POST http://localhost:5000/api/cart \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":2}'
```

---

### Step 5: View Cart
```bash
curl -X GET http://localhost:5000/api/cart \
  -H "Authorization: Bearer $USER_TOKEN"
```

---

### Step 6: Create Order
```bash
# Use existing address (ID: 1 for john@example.com)
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"addressId":1,"paymentMethod":"COD"}'
```

---

### Step 7: View Orders
```bash
curl -X GET http://localhost:5000/api/orders \
  -H "Authorization: Bearer $USER_TOKEN"
```

---

### Step 8: Admin Updates Order Status
```bash
curl -X PUT http://localhost:5000/api/orders/1/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"SHIPPED"}'
```

---

## 🔍 Error Scenarios to Test

### 1. Unauthorized Access
```bash
# Try accessing protected route without token
curl -X GET http://localhost:5000/api/cart
# Expected: 401 Unauthorized
```

---

### 2. Invalid Credentials
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fitverse.com","password":"wrongpassword"}'
# Expected: 401 Unauthorized
```

---

### 3. Insufficient Stock
```bash
# Try adding more quantity than available stock
curl -X POST http://localhost:5000/api/cart \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":999999}'
# Expected: 400 Bad Request
```

---

### 4. Validation Errors
```bash
# Missing required fields
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
# Expected: 422 Unprocessable Entity with validation errors
```

---

### 5. Rate Limiting
```bash
# Make more than 5 login attempts within 15 minutes
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@fitverse.com","password":"admin123"}'
done
# Expected: 429 Too Many Requests after 5th attempt
```

---

## 📊 Database Seed Data

The database is pre-populated with:

- **3 Users**:
  - 1 Admin (admin@fitverse.com)
  - 2 Regular users (john@example.com, jane@example.com)

- **15 Products** across categories:
  - 3 Men's products
  - 3 Women's products
  - 2 Activewear items
  - 2 Footwear items
  - 3 Accessories
  - 2 Thrift items

- **2 Addresses** (one for each test user)

- **1 Cart** with 3 items (for john@example.com)

---

## 🛠️ Using Postman/Thunder Client

1. Import the following base URL: `http://localhost:5000/api`
2. Create an environment variable `baseUrl` = `http://localhost:5000/api`
3. After login, save the token in an environment variable `token`
4. Add Authorization header: `Bearer {{token}}` to all protected routes

---

## 📝 Notes

### OTP System
- OTPs are logged to the server console (not sent via email in development)
- OTP expires in 5 minutes
- Check server logs for OTP codes during signup/resend

### Payment System
- Current implementation uses mock payment (90% success rate)
- Payment verification logs are shown in server console
- For CARD payment: Actual payment happens server-side
- COD orders are immediately marked as PENDING

### Image Uploads
- Images are stored in `uploads/products/` directory
- Max 5 images per product
- Supported formats: jpeg, jpg, png, webp, gif
- Max file size: 5MB per image

### Stock Management
- Stock is automatically reduced when order is created
- Stock is restored when order is cancelled
- Cart checks stock availability before adding items

### Security Features
- Rate limiting: 100 requests/15min (general), 5 requests/15min (auth)
- JWT expires in 7 days
- Passwords hashed with bcrypt (12 rounds)
- Email verification required before cart/order operations
- CORS enabled for frontend origins

---

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill the process
taskkill /F /PID <PID>
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
# Verify .env.development has correct DATABASE_URL

# Regenerate Prisma client
npm run prisma:generate
```

### Prisma Migrations
```bash
# Reset database and reseed
npx prisma migrate reset

# Or manually seed
npm run prisma:seed
```

---

## 🎯 Production Upgrade Points

When moving to production, update these service abstractions:

### 1. OTP Service (`src/services/otpService.js`)
- Replace console.log with SendGrid/Mailgun for email
- Replace console.log with Twilio for SMS

### 2. Payment Service (`src/services/paymentService.js`)
- Integrate Stripe or Razorpay
- Update createPaymentIntent, verifyPayment, processRefund methods

### 3. Image Service (`src/services/imageService.js`)
- Replace local filesystem with AWS S3 or Cloudinary
- Update upload, delete methods

### 4. Environment Variables
- Update `.env.production` with actual API keys
- Deploy PostgreSQL to cloud (AWS RDS, Heroku, etc.)

---

## ✅ Backend Features Completed

- ✅ JWT Authentication with OTP verification
- ✅ Role-based access control (USER, ADMIN)
- ✅ Product CRUD with image upload
- ✅ Shopping cart with stock validation
- ✅ Order management with payment integration
- ✅ Address management
- ✅ Stock tracking and automatic reduction
- ✅ Server-side price calculation
- ✅ Transaction safety (Prisma transactions)
- ✅ Error handling with proper HTTP status codes
- ✅ Request validation with Joi
- ✅ Security middleware (helmet, CORS, rate-limiting)
- ✅ Logging with Winston
- ✅ Graceful shutdown handling
- ✅ API documentation

---

**Happy Testing! 🚀**
