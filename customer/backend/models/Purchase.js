import mongoose from 'mongoose'

const purchaseSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  customerEmail: {
    type: String,
    required: [true, 'Customer email is required'],
    trim: true,
    lowercase: true
  },
  customerPhone: {
    type: String,
    required: [true, 'Customer phone is required'],
    trim: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  /** סכום לתשלום (מסונכרן עם price בעת יצירת הזמנה) — לצורך ביקורת מול Cardcom */
  amount: {
    type: Number,
    min: [0, 'Amount cannot be negative'],
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'succeeded', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'paypal', 'other'],
    default: 'other'
  },
  orderId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  provider: {
    type: String,
    enum: ['cardcom', 'manual'],
    default: 'manual'
  },
  /** מזהה עסקה ב-Cardcom (InternalDealNumber / TransactionId) */
  transactionId: {
    type: String,
    trim: true,
    default: null
  },
  providerTransactionId: {
    type: String,
    trim: true
  },
  cardcomResponseCode: {
    type: String,
    trim: true,
    default: null
  },
  cardcomDescription: {
    type: String,
    trim: true,
    default: null
  },
  /** תגובה גולמית מספק התשלומים (webhook / low-profile) */
  providerResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  refundStatus: {
    type: String,
    enum: ['none', 'requested', 'approved', 'rejected', 'refunded', 'failed'],
    default: 'none',
  },
  refundRequestedAt: {
    type: Date,
    default: null,
  },
  refundReviewedAt: {
    type: Date,
    default: null,
  },
  refundCompletedAt: {
    type: Date,
    default: null,
  },
  refundRequestReason: {
    type: String,
    trim: true,
    maxlength: [1000, 'Refund request reason cannot exceed 1000 characters'],
    default: '',
  },
  refundDecisionReason: {
    type: String,
    trim: true,
    maxlength: [1000, 'Refund decision reason cannot exceed 1000 characters'],
    default: '',
  },
  refundEligibilitySnapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  coachingStartedAt: {
    type: Date,
    default: null
  },
  coachingEndsAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

purchaseSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

const Purchase = mongoose.model('Purchase', purchaseSchema)

export default Purchase
