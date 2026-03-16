import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense']
  },
  category: {
    type: String,
    required: true,
    enum: [
      // Income categories
      'course_sales',
      'session_fees',
      'consultation',
      'other_income',
      // Expense categories
      'salaries',
      'rent',
      'marketing',
      'utilities',
      'supplies',
      'software',
      'insurance',
      'taxes',
      'other_expense'
    ]
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'bank_transfer', 'check', 'other'],
    default: 'bank_transfer'
  },
  reference: {
    type: String, // מספר חשבונית, מספר העברה וכו'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null // null אם זה לא קשור ללקוח ספציפי
  },
  purchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase',
    default: null // null אם זה לא קשור לרכישה ספציפית
  },
  createdBy: {
    type: String,
    default: 'admin'
  },
  notes: {
    type: String
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: null
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
})

// Indexes for better query performance
transactionSchema.index({ date: -1 })
transactionSchema.index({ type: 1, date: -1 })
transactionSchema.index({ category: 1 })
transactionSchema.index({ customer: 1 })

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return this.type === 'expense' ? -Math.abs(this.amount) : Math.abs(this.amount)
})

// Ensure virtuals are included in JSON
transactionSchema.set('toJSON', { virtuals: true })
transactionSchema.set('toObject', { virtuals: true })

const Transaction = mongoose.model('Transaction', transactionSchema)

export default Transaction

