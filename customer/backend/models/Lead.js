import mongoose from 'mongoose'

const leadSchema = new mongoose.Schema({
  // פרטי איש קשר
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // תשובות לשאלון
  answers: [{
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    }
  }],
  
  // הערות נוספות
  additionalNotes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // בחירת המשתמש - מה הוא רוצה לעשות אחרי השאלון
  nextStep: {
    type: String,
    enum: ['book_appointment', 'wait_for_contact'],
    required: true
  },
  
  // סטטוס הליד
  status: {
    type: String,
    enum: ['new', 'contacted', 'converted', 'not_interested'],
    default: 'new'
  },
  
  // הערות מנהל
  adminNotes: {
    type: String
  },
  
  // תאריכים
  createdAt: {
    type: Date,
    default: Date.now
  },
  contactedAt: {
    type: Date
  },
  convertedAt: {
    type: Date
  }
})

// Index for faster queries
leadSchema.index({ createdAt: -1 })
leadSchema.index({ status: 1 })

const Lead = mongoose.model('Lead', leadSchema)

export default Lead

