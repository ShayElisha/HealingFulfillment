import '../load-env.js'
import mongoose from 'mongoose'

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('חסר MONGODB_URI — הוסף ב-backend/.env או customer/backend/.env')
  process.exit(1)
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 })
  console.log('✅ חיבור MongoDB הצליח')
  await mongoose.disconnect()
  process.exit(0)
} catch (e) {
  console.error('❌ חיבור MongoDB נכשל:', e.message)
  process.exit(1)
}
