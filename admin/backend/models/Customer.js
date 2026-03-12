import mongoose from 'mongoose'

const customerSchema = new mongoose.Schema({
  // פרטי לקוח
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    unique: true,
    index: true
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true
  },
  
  // קישור לרכישות ופגישות
  purchases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase'
  }],
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  
  // תוכן וקבצים אישיים
  files: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['image', 'pdf', 'document', 'video', 'audio', 'other'],
      default: 'other'
    },
    size: {
      type: Number // in bytes
    },
    description: {
      type: String,
      trim: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: String,
      default: 'admin'
    }
  }],
  
  // הערות ומעקב
  notes: [{
    content: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: String,
      default: 'admin'
    }
  }],
  
  // סטטיסטיקות
  totalSessions: {
    type: Number,
    default: 0
  },
  completedSessions: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  
  // סטטוס
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
  },
  
  // שדות אימות
  passwordHash: {
    type: String,
    select: false // לא נכלל ב-query default
  },
  hasAccount: {
    type: Boolean,
    default: false
  },
  mustChangePassword: {
    type: Boolean,
    default: true
  },
  accountCreatedAt: {
    type: Date
  },
  lastLoginAt: {
    type: Date
  },
  
  // תאריכים
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

// Index for faster queries
customerSchema.index({ status: 1 })

const Customer = mongoose.model('Customer', customerSchema)

export default Customer

