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
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'cancelled'],
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
  providerTransactionId: {
    type: String,
    trim: true
  },
  providerResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
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

