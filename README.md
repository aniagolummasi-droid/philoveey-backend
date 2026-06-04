# Philoveey Backend

Express + MongoDB API for the ecommerce frontend.

## Setup

```bash
npm install
npm run dev
```

The API runs on:

```txt
http://localhost:5000
```

Browser views:

```txt
GET /                  Backend home
GET /admin             Admin dashboard
GET /admin/products    Product list view
GET /admin/orders      Order list view
```

Update `.env` before production:

```txt
MONGO_URI=
JWT_SECRET=
CLIENT_URL=
PAYSTACK_SECRET_KEY=
```

For production CORS, set `CLIENT_URL` to the live frontend origins:

```txt
CLIENT_URL=https://philoveey.vercel.app,https://philoveeystore.com.ng,https://www.philoveeystore.com.ng
```

## Main Routes

Auth:

```txt
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
PUT  /api/auth/profile
```

Products:

```txt
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

Cart:

```txt
GET    /api/cart
POST   /api/cart
PUT    /api/cart/:productId
DELETE /api/cart/:productId
DELETE /api/cart
```

Orders:

```txt
POST /api/orders
GET  /api/orders/my-orders
GET  /api/orders/:id
GET  /api/orders
PUT  /api/orders/:id/status
```

Payments:

```txt
POST /api/payments/initialize/:orderId
GET  /api/payments/verify/:reference
POST /api/payments/webhook/paystack
```

Configure the Paystack dashboard callback URL to:

```txt
https://philoveeystore.com.ng/#payment-status
```

Configure the Paystack dashboard webhook URL to:

```txt
https://YOUR_BACKEND_DOMAIN/api/payments/webhook/paystack
```

Set the backend environment variables in `.env`:

```txt
PAYSTACK_SECRET_KEY=sk_test_177eb489a594911ecd18f3493fc1b63a3ff8ecf5
PAYSTACK_CALLBACK_URL=https://philoveeystore.com.ng/#payment-status
```

The webhook verifies `x-paystack-signature` with `PAYSTACK_SECRET_KEY` and
handles `charge.success` and `charge.failed` events.

Product image uploads use the `image` field with `multipart/form-data`.
