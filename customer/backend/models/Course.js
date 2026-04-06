import mongoose from 'mongoose'

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  sessionsCount: {
    type: Number,
    required: [true, 'Sessions count is required'],
    min: [1, 'Sessions count must be at least 1'],
    default: 1
  },
  coachingProcessMonths: {
    type: Number,
    min: [1, 'Coaching duration must be at least 1 month'],
    max: [60, 'Coaching duration cannot exceed 60 months']
  },
  coachingProcessStartAt: { type: Date },
  coachingProcessEndAt: { type: Date },
  installmentsCount: {
    type: Number,
    default: 1,
    min: [1, 'Number of payments must be at least 1'],
    max: [120, 'Number of payments cannot exceed 120']
  },
  price: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    default: 0,
    min: [0, 'Original price cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100']
  },
  videos: [{
    title: { type: String, trim: true },
    url: { type: String, trim: true },
    description: { type: String, trim: true },
    duration: { type: Number },
    order: { type: Number, default: 0 }
  }],
  isActive: {
    type: Boolean,
    default: true
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

courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

courseSchema.index({ isActive: 1, createdAt: -1 })

const Course = mongoose.model('Course', courseSchema)

export default Course

