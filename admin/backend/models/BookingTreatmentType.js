import mongoose from 'mongoose'

const bookingTreatmentTypeSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9_-]{1,40}$/, 'Invalid treatment key'],
  },
  label: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  /** משך הפגישה בדקות (לחישוב חפיפה וחלונות) */
  durationMinutes: {
    type: Number,
    required: true,
    min: 15,
    max: 480,
    default: 60,
  },
  /** ריווח בין נקודות התחלה אפשריות (רשת) */
  slotStepMinutes: {
    type: Number,
    required: true,
    min: 5,
    max: 120,
    default: 30,
  },
  order: {
    type: Number,
    default: 0,
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

bookingTreatmentTypeSchema.index({ order: 1 })

const BookingTreatmentType = mongoose.model('BookingTreatmentType', bookingTreatmentTypeSchema)

export default BookingTreatmentType
