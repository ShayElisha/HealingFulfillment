import mongoose from 'mongoose'

const availabilityTimeOffSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
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

const AvailabilityTimeOff = mongoose.model('AvailabilityTimeOff', availabilityTimeOffSchema)

export default AvailabilityTimeOff
