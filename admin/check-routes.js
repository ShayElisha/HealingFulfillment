/**
 * Express Routes Audit & Fix
 * 
 * Scans backend/routes/*.js files and ensures:
 * 1. Each file exports a Router (`export default router`)
 * 2. Each route is registered in backend/server.js under `/api/...`
 * 3. Warns about missing or misnamed routes
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to backend/routes
const ROUTES_DIR = path.join(__dirname, 'backend', 'routes')
const SERVER_FILE = path.join(__dirname, 'backend', 'server.js')

// Helper to read JS file content
const readFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message)
    return ''
  }
}

// Scan all route files
const routeFiles = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith('.js'))

console.log('🔎 Scanning backend/routes...\n')
const routeStatus = []

for (const file of routeFiles) {
  const filePath = path.join(ROUTES_DIR, file)
  const content = readFile(filePath)

  // Check if file exports default router
  const hasDefaultExport = /export\s+default\s+router/.test(content)
  const hasRouter = /const\s+router\s*=\s*express\.Router\(\)/.test(content)
  
  // Determine expected API path
  const routeName = file.replace('.js', '')
  let expectedPath
  if (routeName === 'admin') {
    expectedPath = '/api/admin'
  } else if (routeName === 'customers') {
    expectedPath = '/api' // customers routes are registered at /api
  } else {
    expectedPath = `/api/${routeName}`
  }

  routeStatus.push({ 
    file, 
    hasDefaultExport, 
    hasRouter,
    expectedPath,
    routeName
  })
  
  if (!hasRouter) {
    console.warn(`⚠️  ${file} does not define router!`)
  }
  if (!hasDefaultExport) {
    console.warn(`⚠️  ${file} does not export default router!`)
  }
}

// Check server.js registrations
const serverContent = readFile(SERVER_FILE)
console.log('🔎 Checking server.js route registrations...\n')

const issues = []
const registered = []

routeStatus.forEach(r => {
  // Check for registration - need to escape special regex chars
  const escapedPath = r.expectedPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const isRegistered = new RegExp(`app\\.use\\(['"\`]${escapedPath}['"\`]`).test(serverContent)
  
  // Also check for import - handle kebab-case to camelCase conversion
  // e.g., test-email.js -> testEmailRoutes
  const camelCaseName = r.routeName.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
  const importName = `${camelCaseName}Routes`
  const isImported = new RegExp(`import\\s+${importName}\\s+from`).test(serverContent)
  
  if (!isImported) {
    issues.push({
      type: 'missing_import',
      file: r.file,
      importName: importName,
      expectedPath: r.expectedPath
    })
  }
  
  if (!isRegistered) {
    issues.push({
      type: 'missing_registration',
      file: r.file,
      expectedPath: r.expectedPath,
      importName: importName
    })
  } else {
    registered.push({
      file: r.file,
      path: r.expectedPath,
      hasDefaultExport: r.hasDefaultExport,
      hasRouter: r.hasRouter
    })
  }
})

// Print results
console.log('✅ Registered Routes:')
let allValid = true
registered.forEach(r => {
  const status = []
  if (!r.hasRouter) {
    status.push('❌ no router')
    allValid = false
  }
  if (!r.hasDefaultExport) {
    status.push('❌ no export')
    allValid = false
  }
  const statusStr = status.length > 0 ? ` (${status.join(', ')})` : ' ✅'
  console.log(`   ${r.file.padEnd(20)} → ${r.path}${statusStr}`)
})

if (allValid && registered.length > 0) {
  console.log('\n✅ All routes have valid router definitions and exports!')
}

if (issues.length > 0) {
  console.log('\n⚠️  Issues Found:')
  issues.forEach(issue => {
    if (issue.type === 'missing_import') {
      console.log(`   ❌ ${issue.file}: Missing import statement`)
      console.log(`      Add: import ${issue.importName} from './routes/${issue.file.replace('.js', '')}.js'`)
    } else if (issue.type === 'missing_registration') {
      console.log(`   ❌ ${issue.file}: Not registered in server.js`)
      console.log(`      Add: app.use('${issue.expectedPath}', ${issue.importName})`)
    }
  })
} else {
  console.log('\n✅ All routes are properly registered!')
}

console.log(`\n📊 Summary: ${registered.length} registered, ${issues.length} issues`)

