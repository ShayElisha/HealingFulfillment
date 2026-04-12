import mongoose from 'mongoose'

const detailImageItemSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true, maxlength: 8192 },
    caption: { type: String, default: '', trim: true, maxlength: 500 },
  },
  { _id: false }
)

const detailBlockSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['timeline', 'audio', 'images'], required: true },
    timelinePoints: { type: [String], default: [] },
    audioUrl: { type: String, default: '', maxlength: 8192 },
    audioTitle: { type: String, default: '', maxlength: 200 },
    imageItems: { type: [detailImageItemSchema], default: [] },
  },
  { _id: true }
)

const forWhomProfileSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'נדרשת כותרת הדלת'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'נדרש תקציר (תוכן מאחורי הדלת)'],
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
    detailPageContent: {
      type: String,
      default: '',
    },
    detailVideoUrl: {
      type: String,
      trim: true,
      default: '',
      maxlength: 8192,
    },
    detailBlocks: { type: [detailBlockSchema], default: [] },
  },
  {
    timestamps: true,
  }
)

forWhomProfileSchema.index({ isActive: 1, order: 1 })

const ForWhomProfile = mongoose.model('ForWhomProfile', forWhomProfileSchema)

export default ForWhomProfile
