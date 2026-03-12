import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  // נמענים
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  }],
  
  // תוכן ההודעה
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  
  // ערוצי שליחה
  channels: [{
    type: String,
    enum: ['email', 'whatsapp', 'system'],
    required: true
  }],
  
  // סטטוס שליחה
  status: {
    type: String,
    enum: ['pending', 'sending', 'sent', 'failed', 'partially_sent'],
    default: 'pending'
  },
  
  // תוצאות שליחה
  sendResults: [{
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    channel: {
      type: String,
      enum: ['email', 'whatsapp', 'system']
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending']
    },
    error: {
      type: String
    },
    note: {
      type: String
    },
    whatsappLink: {
      type: String
    },
    sid: {
      type: String // Twilio Message SID
    },
    code: {
      type: String // Error code if failed
    },
    sentAt: {
      type: Date
    }
  }],
  
  // מי יצר את ההודעה
  createdBy: {
    type: String,
    default: 'admin'
  },
  
  // תאריכים
  createdAt: {
    type: Date,
    default: Date.now
  },
  sentAt: {
    type: Date
  }
})

// Index for faster queries
messageSchema.index({ createdAt: -1 })
messageSchema.index({ recipients: 1 })
messageSchema.index({ status: 1 })

const Message = mongoose.model('Message', messageSchema)

export default Message

