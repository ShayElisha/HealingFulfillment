import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false // לא חובה כי יכול להיות גם בלי התחברות
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  preferredDate: {
    type: Date,
    required: [true, 'Preferred date is required']
  },
  preferredTime: {
    type: String,
    trim: true
  },
  meetingType: {
    type: String,
    enum: ['frontend', 'zoom'],
    default: 'frontend',
    required: [true, 'Meeting type is required']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  sessionSummary: {
    type: String,
    maxlength: [5000, 'Session summary cannot exceed 5000 characters'],
    trim: true
  },
  isIntroMeeting: {
    type: Boolean,
    default: false // false = פגישה רגילה, true = פגישת היכרות
  },
  zoomLink: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Booking = mongoose.model('Booking', bookingSchema)

export default Booking

