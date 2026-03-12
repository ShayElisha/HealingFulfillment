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
  price: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative']
  },
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

