/**
 * טוען .env: קודם תיקיית השירות, אחר כך HealingFulfillment/backend/.env
 * עם override — כך עריכה בקובץ השורשית (שבדרך כלל פתוח בעורך) משפיעה בפועל.
 */
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoBackendEnv = path.join(__dirname, '..', '..', 'backend', '.env')

dotenv.config({ path: path.join(__dirname, '.env') })
dotenv.config({ path: repoBackendEnv, override: true })

if (process.env.DIAGNOSE_ENV === '1') {
  const local = path.join(__dirname, '.env')
  const repo = repoBackendEnv
  console.log('[load-env] service .env exists:', fs.existsSync(local), local)
  console.log('[load-env] repo    .env exists:', fs.existsSync(repo), repo)
  console.log('[load-env] MONGODB_URI set:', Boolean(process.env.MONGODB_URI))
}
