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

const triggerJournalEntrySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
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
    triggerDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    contextOrBody: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    intensity: {
      type: Number,
      min: 1,
      max: 10,
    },
    feelingsNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    copingOrWhatHelped: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: '',
    },
  },
  { timestamps: true }
)

triggerJournalEntrySchema.index({ customer: 1, entryDate: -1, createdAt: -1 })

const TriggerJournalEntry = mongoose.model('TriggerJournalEntry', triggerJournalEntrySchema)

export default TriggerJournalEntry
