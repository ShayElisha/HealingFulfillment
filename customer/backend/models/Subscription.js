import mongoose from 'mongoose'

const planSnapshotSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    price: { type: Number },
    discount: { type: Number },
    coachingProcessMonths: { type: Number, default: null },
    installmentsCount: { type: Number },
    sessionsCount: { type: Number, default: null },
    capturedAt: { type: Date }
  },
  { _id: false }
)

const subscriptionSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  purchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase',
    required: true,
    unique: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  planSnapshot: planSnapshotSchema,
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active',
    index: true
  },
  startedAt: { type: Date, required: true },
  endsAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

subscriptionSchema.pre('save', function (next) {
  this.updatedAt = Date.now()
  next()
})

subscriptionSchema.index({ customer: 1, status: 1, endsAt: 1 })

const Subscription = mongoose.model('Subscription', subscriptionSchema)

export default Subscription
