import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'NGN',
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    provider: {
      type: String,
      enum: ['paystack', 'cash', 'transfer'],
      default: 'paystack',
    },
    rawResponse: mongoose.Schema.Types.Mixed,
    reference: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
)

const Transaction = mongoose.model('Transaction', transactionSchema)

export default Transaction
