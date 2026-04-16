import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
  // לקוח שכתב את הביקורת
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  
  // שם הלקוח (למקרה שהלקוח נמחק)
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  
  // דירוג (1-5 כוכבים)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer between 1 and 5'
    }
  },
  
  // תוכן הביקורת
  content: {
    type: String,
    required: [true, 'Review content is required'],
    trim: true,
    maxlength: [1000, 'Review content cannot exceed 1000 characters']
  },

  // סרטון חוות דעת (אופציונלי)
  video: {
    url: {
      type: String,
      trim: true,
      maxlength: 8192,
    },
    name: {
      type: String,
      trim: true,
    },
    size: {
      type: Number,
      min: 0,
    },
    uploadedAt: {
      type: Date,
    },
  },

  // מונע הענקת שבוע נוסף יותר מפעם אחת
  videoRewardGrantedAt: {
    type: Date,
  },
  
  // סטטוס הביקורת (pending, approved, rejected)
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // תאריכים
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  }
})

// Index for faster queries
reviewSchema.index({ status: 1, createdAt: -1 })
reviewSchema.index({ customer: 1 })
reviewSchema.index({ rating: -1 })

reviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  if (this.status === 'approved' && !this.approvedAt) {
    this.approvedAt = Date.now()
  }
  next()
})

const Review = mongoose.model('Review', reviewSchema)

export default Review

