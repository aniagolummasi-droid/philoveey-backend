import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: String,
    image: String,
    price: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      country: {
        type: String,
        default: 'Nigeria',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['paystack', 'transfer', 'cash'],
      default: 'paystack',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    paymentReference: String,
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paidAt: Date,
  },
  { timestamps: true },
)

const Order = mongoose.model('Order', orderSchema)

export default Order
