import mongoose from 'mongoose'

/**
 * סימון «נקרא» להתראות פעילות במנהל (פגישה, פנייה, ליד וכו').
 * מפתח ייחודי: אדמין + סוג ישות + מזהה ישות.
 */
const adminNotificationReadSchema = new mongoose.Schema(
  {
    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    activityKind: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    /** מחרוזת מזהה המסמך המקורי (כמו String(_id)) */
    activityId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

adminNotificationReadSchema.index(
  { adminUser: 1, activityKind: 1, activityId: 1 },
  { unique: true }
)

const AdminNotificationRead = mongoose.model('AdminNotificationRead', adminNotificationReadSchema)

export default AdminNotificationRead
