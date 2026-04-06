/**
 * אבחון מלא: קבצי .env, מחרוזת חיבור (ללא סיסמה), חיבור Atlas, שמות DB ואוספים, ספירות דוגמה.
 * הרצה: npm run diagnose:db
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import '../load-env.js'
import mongoose from 'mongoose'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serviceEnv = path.join(__dirname, '..', '.env')
const repoEnv = path.join(__dirname, '..', '..', '..', 'backend', '.env')

function maskUri(uri) {
  if (!uri || typeof uri !== 'string') return '(ריק)'
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/, '$1***$3')
}

console.log('\n=== אבחון MongoDB (customer backend) ===\n')

console.log('קבצים:')
console.log('  service .env:', fs.existsSync(serviceEnv) ? 'קיים' : 'חסר', serviceEnv)
console.log('  repo    .env:', fs.existsSync(repoEnv) ? 'קיים' : 'חסר', repoEnv)

const uri = process.env.MONGODB_URI
console.log('\nMONGODB_URI אחרי load-env:')
console.log('  מוגדר:', Boolean(uri))
if (uri) console.log('  (ממוסך):', maskUri(uri))

if (!uri) {
  console.error('\n❌ אין MONGODB_URI. הוסף ל-backend/.env או customer/backend/.env')
  process.exit(1)
}

console.log('\nמנסה להתחבר (עד 15 שניות)...')
try {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000
  })
} catch (e) {
  console.error('\n❌ חיבור נכשל:', e.message)
  console.error('\nסיבות נפוצות:')
  console.error('  • Atlas: קלאסטר מושהה (Resume), או סיסמת משתמש שגויה')
  console.error('  • רשת: VPN / חומת אש חוסמים יציאה ל-mongodb+srv')
  console.error('  • URI: תווים מיוחדים בסיסמה חייבים קידוד URL (%40 וכו\')')
  process.exit(1)
}

const db = mongoose.connection.db
const dbName = db.databaseName
console.log('\n✅ מחובר')
console.log('  שם מסד (מה-URI):', dbName)

const cols = await db.listCollections().toArray()
const names = cols.map((c) => c.name).sort()
console.log('  אוספים במסד:', names.length ? names.join(', ') : '(אין — מסד ריק ממסמכים?)')

async function count(collection) {
  try {
    return await db.collection(collection).countDocuments()
  } catch {
    return -1
  }
}

const sample = ['categories', 'reviews', 'courses', 'customers', 'purchases']
console.log('\nספירות (לדוגמה):')
for (const c of sample) {
  const n = await count(c)
  console.log(`  ${c}: ${n < 0 ? 'שגיאה' : n}`)
}

const nCategories = await count('categories')
if (nCategories > 0) {
  const active = await db.collection('categories').countDocuments({ isActive: true })
  console.log(`\n  categories פעילים (isActive:true): ${active} מתוך ${nCategories}`)
  if (active === 0) {
    console.log('  ⚠️  כולם לא פעילים — GET /api/categories יחזיר מערך ריק (לא בהכרח תקלת חיבור).')
  }
}

await mongoose.disconnect()
console.log('\n=== סיום אבחון ===\n')
