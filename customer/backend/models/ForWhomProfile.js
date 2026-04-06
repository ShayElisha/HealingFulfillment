import mongoose from 'mongoose'

const forWhomProfileSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'נדרש כותרת'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'נדרש תיאור'],
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

forWhomProfileSchema.index({ isActive: 1, order: 1 })

const ForWhomProfile = mongoose.model('ForWhomProfile', forWhomProfileSchema)

export default ForWhomProfile
