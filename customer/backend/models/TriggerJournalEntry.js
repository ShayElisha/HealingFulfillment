import mongoose from 'mongoose'

/** חלקי היום — לתיעוד תריגרים */
export const PART_OF_DAY_VALUES = [
  'night',
  'early_morning',
  'morning',
  'noon',
  'afternoon',
  'evening',
  'late_evening',
]

export const BREATHING_TYPE_VALUES = [
  'unaware_held',
  'fast_contracted',
  'regular_flowing',
  'not_noticed',
]

const triggerJournalEntrySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    /** תאריך היום שאליו מתייחס התיעוד (שמירה כ־UTC 00:00 של אותו יום בלוח) */
    entryDate: {
      type: Date,
      required: true,
      index: true,
    },
    partOfDay: {
      type: String,
      required: true,
      enum: PART_OF_DAY_VALUES,
    },
    /** תיאור התריגר / מה קרה */
    triggerDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    /** איפה בגוף / הקשר (אופציונלי) */
    contextOrBody: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    /** עוצמה 1–10 (אופציונלי) */
    intensity: {
      type: Number,
      min: 1,
      max: 10,
    },
    /** מה היו המחשבות שלי */
    thoughts: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    /** נשימה בזמן האירוע */
    breathingType: {
      type: String,
      enum: BREATHING_TYPE_VALUES,
      default: 'not_noticed',
    },
    /** רגשות / מחשבות בקצרה */
    feelingsNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    /** תחושות בגוף */
    bodySensations: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    /** מה עזר / מה ניסית */
    copingOrWhatHelped: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    /** הערות חופשיות */
    notes: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: '',
    },
    /** מה השיעור שלי מהאירוע */
    lessonLearned: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
  },
  { timestamps: true }
)

triggerJournalEntrySchema.index({ customer: 1, entryDate: -1, createdAt: -1 })

const TriggerJournalEntry = mongoose.model('TriggerJournalEntry', triggerJournalEntrySchema)

export default TriggerJournalEntry
