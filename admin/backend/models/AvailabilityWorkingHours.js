import mongoose from 'mongoose'

const availabilityWorkingHoursSchema = new mongoose.Schema({
  /** 0 = ראשון … 6 = שבת (כמו Date.getDay()) */
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
  },
  startTime: {
    type: String,
    required: true,
    trim: true,
    match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'startTime must be HH:mm'],
  },
  endTime: {
    type: String,
    required: true,
    trim: true,
    match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'endTime must be HH:mm'],
  },
  /** null / חסר = כל סוגי הטיפול */
  treatmentKey: {
    type: String,
    trim: true,
    lowercase: true,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

availabilityWorkingHoursSchema.index({ dayOfWeek: 1, treatmentKey: 1 })

const AvailabilityWorkingHours = mongoose.model('AvailabilityWorkingHours', availabilityWorkingHoursSchema)

export default AvailabilityWorkingHours
