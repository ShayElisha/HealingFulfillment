import express from 'express'
import ForWhomProfile from '../models/ForWhomProfile.js'

const router = express.Router()

function sortProfiles(list) {
  return [...list].sort((a, b) => {
    const ao = Number(a.order) || 0
    const bo = Number(b.order) || 0
    if (ao !== bo) return ao - bo
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return db - da
  })
}

// GET /api/for-whom-audience — ציבורי, רק פעילים
router.get('/for-whom-audience', async (req, res, next) => {
  try {
    const rows = sortProfiles(await ForWhomProfile.find({ isActive: true }).lean())
    res.json({
      message: 'נשלף בהצלחה',
      data: rows,
    })
  } catch (error) {
    next(error)
  }
})

export default router
