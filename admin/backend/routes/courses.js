import express from 'express'
import Category from '../models/Category.js'
import Course from '../models/Course.js'

const router = express.Router()

// GET /api/courses - Get all active courses
router.get('/', async (req, res, next) => {
  try {
    const courses = await Course.find({ isActive: true })
      .select('title description videos price')
      .sort({ createdAt: -1 })
    
    res.json({
      message: 'Courses retrieved successfully',
      data: courses
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/courses/:id - Get single course details
router.get('/:id', async (req, res, next) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      isActive: true
    })
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }
    
    res.json({
      message: 'Course retrieved successfully',
      data: course
    })
  } catch (error) {
    next(error)
  }
})

export default router

