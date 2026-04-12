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
    /** נקודות בציר זמן (תצוגה כרשימת נקודות) */
    timelinePoints: { type: [String], default: [] },
    audioUrl: { type: String, default: '', maxlength: 2048 },
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
    /** תוכן העמוד המלא (נפרד מהתקציר שמאחורי הדלת). בציבורי: /for-whom/ + מזהה המסמך */
    detailPageContent: {
      type: String,
      default: '',
    },
    /** קישור לסרטון (YouTube / Vimeo / קובץ mp4 וכו') — מוצג גדול בעמוד הציבורי מתחת לכותרת */
    detailVideoUrl: {
      type: String,
      trim: true,
      default: '',
      maxlength: 8192,
    },
    /** בלוקי תוכן נוספים לעמוד הציבורי (ציר זמן, אודיו, גלריה) */
    detailBlocks: { type: [detailBlockSchema], default: [] },
  },
  {
    timestamps: true,
  }
)

forWhomProfileSchema.index({ isActive: 1, order: 1 })

const ForWhomProfile = mongoose.model('ForWhomProfile', forWhomProfileSchema)

export default ForWhomProfile
