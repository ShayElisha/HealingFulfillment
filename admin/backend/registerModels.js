/**
 * רישום מפורש של כל מודלי Mongoose לפני טיפול בבקשות.
 * מונע MissingSchemaError ב-populate כשסדר טעינת מודולים / bundler משתנה (למשל Vercel).
 */
import './models/AdminNotificationRead.js'
import './models/AvailabilityBlock.js'
import './models/AvailabilityTimeOff.js'
import './models/AvailabilityWorkingHours.js'
import './models/Booking.js'
import './models/BookingTreatmentType.js'
import './models/Category.js'
import './models/Contact.js'
import './models/Course.js'
import './models/Customer.js'
import './models/ForWhomProfile.js'
import './models/Lead.js'
import './models/Message.js'
import './models/Purchase.js'
import './models/Review.js'
import './models/Subscription.js'
import './models/Transaction.js'
import './models/TriggerJournalEntry.js'
