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
  /** שדה ישן — נשמר לתאימות; הצד הציבורי עדיין עלול להשתמש בו */
  sessionsCount: {
    type: Number,
    min: [0, 'Sessions count cannot be negative']
  },
  /** משך תהליך הליווי בחודשים (למשל 3) */
  coachingProcessMonths: {
    type: Number,
    default: 3,
    min: [1, 'Coaching duration must be at least 1 month'],
    max: [60, 'Coaching duration cannot exceed 60 months']
  },
  /** שדות ישנים — נשמרים לתאימות עם מסמכים קיימים */
  coachingProcessStartAt: {
    type: Date
  },
  coachingProcessEndAt: {
    type: Date
  },
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
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  videos: [{
    title: { type: String, trim: true },
    url: { type: String, trim: true, maxlength: 8192 },
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

const Course = mongoose.model('Course', courseSchema)

export default Course

