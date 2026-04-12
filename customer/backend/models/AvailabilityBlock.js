import mongoose from 'mongoose'

const availabilityBlockSchema = new mongoose.Schema({
  kind: {
    type: String,
    enum: ['once', 'weekly'],
    required: true,
    default: 'once',
  },
  /** ל-kind once — YYYY-MM-DD (מניעת באגי אזור זמן) */
  onceDateKey: {
    type: String,
    trim: true,
    default: null,
  },
  /** ל-kind weekly — 0–6 */
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6,
    default: null,
  },
  fullDay: {
    type: Boolean,
    default: false,
  },
  startTime: {
    type: String,
    trim: true,
    default: null,
  },
  endTime: {
    type: String,
    trim: true,
    default: null,
  },
  treatmentKey: {
    type: String,
    trim: true,
    lowercase: true,
    default: null,
  },
  note: {
    type: String,
    trim: true,
    maxlength: 200,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

availabilityBlockSchema.index({ kind: 1, onceDateKey: 1 })
availabilityBlockSchema.index({ kind: 1, dayOfWeek: 1 })

const AvailabilityBlock = mongoose.model('AvailabilityBlock', availabilityBlockSchema)

export default AvailabilityBlock
