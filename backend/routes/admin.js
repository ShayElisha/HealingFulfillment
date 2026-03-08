import express from 'express'
import Category from '../models/Category.js'
import Course from '../models/Course.js'
import Purchase from '../models/Purchase.js'
import Booking from '../models/Booking.js'

const router = express.Router()

// ========== CATEGORIES ==========

// GET /api/admin/categories - Get all categories
router.get('/categories', async (req, res, next) => {
  try {
    console.log('Fetching categories...')
    const categories = await Category.find().sort({ order: 1, createdAt: -1 }).lean()
    console.log(`Found ${categories.length} categories`)
    
    // Normalize therapeuticApproach, symptoms, and copingMethods to arrays
    const normalizedCategories = categories.map((cat, index) => {
      try {
        // Convert therapeuticApproach from string to array if needed
        if (cat.therapeuticApproach && typeof cat.therapeuticApproach === 'string' && cat.therapeuticApproach.trim() !== '') {
          cat.therapeuticApproach = [cat.therapeuticApproach]
        } else if (!Array.isArray(cat.therapeuticApproach)) {
          cat.therapeuticApproach = []
        }
        
        // Ensure symptoms and copingMethods are arrays
        if (!Array.isArray(cat.symptoms)) {
          cat.symptoms = []
        }
        if (!Array.isArray(cat.copingMethods)) {
          cat.copingMethods = []
        }
        
        return cat
      } catch (err) {
        console.error(`Error normalizing category ${index}:`, err)
        // Return category with safe defaults
        return {
          ...cat,
          therapeuticApproach: Array.isArray(cat.therapeuticApproach) ? cat.therapeuticApproach : [],
          symptoms: Array.isArray(cat.symptoms) ? cat.symptoms : [],
          copingMethods: Array.isArray(cat.copingMethods) ? cat.copingMethods : []
        }
      }
    })
    
    console.log('Categories normalized successfully')
    res.json({
      message: 'Categories retrieved successfully',
      data: normalizedCategories
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    res.status(500).json({
      message: 'Error fetching categories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// POST /api/admin/categories - Create new category
router.post('/categories', async (req, res, next) => {
  try {
    // Ensure files array exists and has correct structure
    // Also normalize therapeuticApproach, symptoms, and copingMethods to arrays
    const categoryData = {
      ...req.body,
      files: req.body.files || [],
      symptoms: Array.isArray(req.body.symptoms) ? req.body.symptoms : [],
      copingMethods: Array.isArray(req.body.copingMethods) ? req.body.copingMethods : [],
      therapeuticApproach: Array.isArray(req.body.therapeuticApproach) 
        ? req.body.therapeuticApproach 
        : []
    }
    const category = new Category(categoryData)
    await category.save()
    
    // Normalize the response
    const categoryObj = category.toObject ? category.toObject() : category
    if (!Array.isArray(categoryObj.therapeuticApproach)) {
      categoryObj.therapeuticApproach = []
    }
    if (!Array.isArray(categoryObj.symptoms)) {
      categoryObj.symptoms = []
    }
    if (!Array.isArray(categoryObj.copingMethods)) {
      categoryObj.copingMethods = []
    }
    
    res.status(201).json({
      message: 'Category created successfully',
      data: categoryObj
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      })
    }
    console.error('Error creating category:', error)
    next(error)
  }
})

// PUT /api/admin/categories/:id - Update category
router.put('/categories/:id', async (req, res, next) => {
  try {
    // Ensure files array exists and has correct structure
    // Also normalize therapeuticApproach, symptoms, and copingMethods to arrays
    const updateData = {
      ...req.body,
      files: req.body.files || [],
      symptoms: Array.isArray(req.body.symptoms) ? req.body.symptoms : [],
      copingMethods: Array.isArray(req.body.copingMethods) ? req.body.copingMethods : [],
      therapeuticApproach: Array.isArray(req.body.therapeuticApproach) 
        ? req.body.therapeuticApproach 
        : (req.body.therapeuticApproach && typeof req.body.therapeuticApproach === 'string' && req.body.therapeuticApproach.trim() !== ''
          ? [req.body.therapeuticApproach]
          : [])
    }
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }
    
    // Normalize the response
    const categoryObj = category.toObject()
    if (!Array.isArray(categoryObj.therapeuticApproach)) {
      categoryObj.therapeuticApproach = []
    }
    if (!Array.isArray(categoryObj.symptoms)) {
      categoryObj.symptoms = []
    }
    if (!Array.isArray(categoryObj.copingMethods)) {
      categoryObj.copingMethods = []
    }
    
    res.json({
      message: 'Category updated successfully',
      data: categoryObj
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      })
    }
    console.error('Error updating category:', error)
    next(error)
  }
})

// DELETE /api/admin/categories/:id - Delete category
router.delete('/categories/:id', async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }
    
    res.json({
      message: 'Category deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

// ========== COURSES ==========

// GET /api/admin/courses - Get all courses
router.get('/courses', async (req, res, next) => {
  try {
    const courses = await Course.find()
      .sort({ createdAt: -1 })
      .lean()
    res.json({
      message: 'Courses retrieved successfully',
      data: courses
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    next(error)
  }
})

// GET /api/admin/courses/:id - Get single course
router.get('/courses/:id', async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
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

// POST /api/admin/courses - Create new course
router.post('/courses', async (req, res, next) => {
  try {
    const course = new Course(req.body)
    await course.save()
    res.status(201).json({
      message: 'Course created successfully',
      data: course
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      })
    }
    next(error)
  }
})

// PUT /api/admin/courses/:id - Update course
router.put('/courses/:id', async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }
    res.json({
      message: 'Course updated successfully',
      data: course
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      })
    }
    next(error)
  }
})

// DELETE /api/admin/courses/:id - Delete course
router.delete('/courses/:id', async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }
    res.json({
      message: 'Course deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

// ========== PURCHASES ==========

// GET /api/admin/purchases - Get all purchases
router.get('/purchases', async (req, res, next) => {
  try {
    const purchases = await Purchase.find()
      .populate({
        path: 'course',
        select: 'title price',
        // Handle cases where course might be deleted
        options: { lean: true }
      })
      .sort({ createdAt: -1 })
      .lean()
    
    // Filter out purchases with null courses if needed, or keep them
    res.json({
      message: 'Purchases retrieved successfully',
      data: purchases
    })
  } catch (error) {
    console.error('Error fetching purchases:', error)
    console.error('Error stack:', error.stack)
    next(error)
  }
})

// PUT /api/admin/purchases/:id/status - Update purchase status
router.put('/purchases/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body
    const purchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('course', 'title price')
    
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' })
    }
    
    res.json({
      message: 'Purchase status updated successfully',
      data: purchase
    })
  } catch (error) {
    next(error)
  }
})

// ========== BOOKINGS ==========

// GET /api/admin/bookings - Get all bookings
router.get('/bookings', async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .lean()
    
    res.json({
      message: 'Bookings retrieved successfully',
      data: bookings
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    next(error)
  }
})

// PUT /api/admin/bookings/:id/status - Update booking status
router.put('/bookings/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }
    
    res.json({
      message: 'Booking status updated successfully',
      data: booking
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/admin/bookings/:id/zoom-link - Update zoom link
router.put('/bookings/:id/zoom-link', async (req, res, next) => {
  try {
    const { zoomLink } = req.body
    
    if (!zoomLink || typeof zoomLink !== 'string') {
      return res.status(400).json({ message: 'Zoom link is required' })
    }
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { zoomLink: zoomLink.trim() },
      { new: true, runValidators: true }
    )
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }
    
    res.json({
      message: 'Zoom link updated successfully',
      data: booking
    })
  } catch (error) {
    console.error('Error updating zoom link:', error)
    next(error)
  }
})

export default router

