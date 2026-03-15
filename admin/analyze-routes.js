/**
 * Route Analysis Script
 * Analyzes all routes and checks for path mismatches between local and Vercel
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROUTES_DIR = path.join(__dirname, 'backend', 'routes')
const SERVER_FILE = path.join(__dirname, 'backend', 'server.js')
const API_INDEX = path.join(__dirname, 'api', 'index.js')

const readFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch (error) {
    return ''
  }
}

console.log('🔍 Analyzing Routes for Vercel Compatibility\n')
console.log('=' .repeat(60))

// Read server.js to find route registrations
const serverContent = readFile(SERVER_FILE)
const routeRegistrations = []

// Extract all app.use('/api/...', ...Routes) patterns
const usePattern = /app\.use\(['"`]([^'"`]+)['"`]\s*,\s*(\w+Routes)/g
let match
while ((match = usePattern.exec(serverContent)) !== null) {
  routeRegistrations.push({
    path: match[1],
    importName: match[2]
  })
}

console.log('\n📋 Route Registrations in server.js:')
routeRegistrations.forEach(r => {
  console.log(`   ${r.path.padEnd(25)} → ${r.importName}`)
})

// Analyze each route file
console.log('\n📁 Analyzing Route Files:\n')

const routeFiles = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith('.js'))
const routeAnalysis = []

for (const file of routeFiles) {
  const filePath = path.join(ROUTES_DIR, file)
  const content = readFile(filePath)
  const routeName = file.replace('.js', '')
  
  // Find all route definitions
  const routePattern = /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g
  const routes = []
  let routeMatch
  while ((routeMatch = routePattern.exec(content)) !== null) {
    routes.push({
      method: routeMatch[1].toUpperCase(),
      path: routeMatch[2]
    })
  }
  
  // Find the registration for this route
  const registration = routeRegistrations.find(r => {
    const camelCaseName = routeName.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
    return r.importName === `${camelCaseName}Routes`
  })
  
  if (registration) {
    // Calculate full paths
    const fullPaths = routes.map(r => {
      let fullPath
      if (r.path === '/') {
        fullPath = registration.path
      } else if (r.path.startsWith('/')) {
        fullPath = registration.path + r.path
      } else {
        fullPath = registration.path + '/' + r.path
      }
      return {
        method: r.method,
        routePath: r.path,
        fullPath: fullPath
      }
    })
    
    routeAnalysis.push({
      file,
      registrationPath: registration.path,
      routes: fullPaths
    })
    
    console.log(`✅ ${file}:`)
    console.log(`   Registered at: ${registration.path}`)
    console.log(`   Routes defined:`)
    fullPaths.forEach(r => {
      console.log(`      ${r.method.padEnd(6)} ${r.fullPath}`)
    })
    console.log()
  } else {
    console.log(`⚠️  ${file}: No registration found!`)
    console.log()
  }
}

// Check api/index.js for URL handling
console.log('🔍 Checking api/index.js URL handling:\n')
const apiIndexContent = readFile(API_INDEX)

// Check if req.url is preserved
const preservesUrl = /req\.url/.test(apiIndexContent)
const hasUrlNormalization = /req\.url\s*=/.test(apiIndexContent)

console.log(`   Preserves req.url: ${preservesUrl ? '✅' : '❌'}`)
console.log(`   Has URL normalization: ${hasUrlNormalization ? '✅' : '⚠️'}`)

// Check for dynamic import
const hasDynamicImport = /import\(['"`]\.\.\/backend\/server\.js['"`]\)/.test(apiIndexContent)
console.log(`   Uses dynamic import(): ${hasDynamicImport ? '✅' : '❌'}`)

// Summary
console.log('\n' + '='.repeat(60))
console.log('📊 Summary:')
console.log(`   Total route files: ${routeFiles.length}`)
console.log(`   Registered routes: ${routeRegistrations.length}`)
console.log(`   Analyzed routes: ${routeAnalysis.length}`)

// Check for potential issues
console.log('\n⚠️  Potential Issues:')

let issuesFound = false

// Check for double /api/api paths
routeAnalysis.forEach(analysis => {
  analysis.routes.forEach(route => {
    if (route.fullPath.includes('/api/api/')) {
      console.log(`   ❌ Double /api/ in path: ${route.fullPath}`)
      issuesFound = true
    }
  })
})

// Check if customers routes are registered correctly (they use /admin/customers)
const customersAnalysis = routeAnalysis.find(a => a.file === 'customers.js')
if (customersAnalysis && customersAnalysis.registrationPath === '/api') {
  const hasAdminCustomers = customersAnalysis.routes.some(r => r.fullPath.includes('/admin/customers'))
  if (hasAdminCustomers) {
    console.log(`   ✅ customers.js correctly uses /api/admin/customers`)
  }
}

if (!issuesFound) {
  console.log('   ✅ No path mismatch issues found!')
}

console.log('\n' + '='.repeat(60))

