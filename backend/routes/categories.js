import express from 'express'
import Category from '../models/Category.js'

const router = express.Router()

// GET /api/categories - Get all active categories
router.get('/', async (req, res, next) => {
  try {
    // Check MongoDB connection
    const mongoose = await import('mongoose')
    if (mongoose.default.connection.readyState !== 1) {
      console.error('MongoDB not connected. State:', mongoose.default.connection.readyState)
      return res.status(500).json({ 
        message: 'Database connection not available',
        error: 'MongoDB connection state: ' + mongoose.default.connection.readyState
      })
    }

    console.log('[Categories] Fetching categories from database...')
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean()
    
    console.log('[Categories] Found', categories.length, 'categories')
    
    // Normalize therapeuticApproach, symptoms, and copingMethods to arrays
    const normalizedCategories = categories.map(cat => {
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
    })
    
    res.json({
      message: 'Categories retrieved successfully',
      data: normalizedCategories
    })
  } catch (error) {
    console.error('[Categories] Error fetching categories:', error)
    console.error('[Categories] Error name:', error.name)
    console.error('[Categories] Error message:', error.message)
    console.error('[Categories] Error stack:', error.stack)
    
    // Return more detailed error information
    res.status(500).json({
      message: 'Failed to fetch categories',
      error: error.message,
      errorName: error.name,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    })
  }
})

// GET /api/categories/:id - Get single category with all details
router.get('/:id', async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      isActive: true
    }).lean()
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }
    
    // Normalize therapeuticApproach, symptoms, and copingMethods to arrays
    // Normalize symptoms
    if (category.symptoms) {
      if (typeof category.symptoms === 'string' && category.symptoms.trim() !== '') {
        category.symptoms = [category.symptoms]
      } else if (!Array.isArray(category.symptoms)) {
        category.symptoms = []
      }
    } else {
      category.symptoms = []
    }
    
    // Normalize copingMethods
    if (category.copingMethods) {
      if (typeof category.copingMethods === 'string' && category.copingMethods.trim() !== '') {
        category.copingMethods = [category.copingMethods]
      } else if (!Array.isArray(category.copingMethods)) {
        category.copingMethods = []
      }
    } else {
      category.copingMethods = []
    }
    
    // Normalize therapeuticApproach
    if (category.therapeuticApproach) {
      if (typeof category.therapeuticApproach === 'string' && category.therapeuticApproach.trim() !== '') {
        category.therapeuticApproach = [category.therapeuticApproach]
      } else if (!Array.isArray(category.therapeuticApproach)) {
        category.therapeuticApproach = []
      }
    } else {
      category.therapeuticApproach = []
    }
    
    console.log('Normalized category:', {
      id: category._id,
      name: category.name,
      symptoms: category.symptoms,
      copingMethods: category.copingMethods,
      therapeuticApproach: category.therapeuticApproach
    })
    
    res.json({
      message: 'Category retrieved successfully',
      data: {
        category
      }
    })
  } catch (error) {
    console.error('Error fetching category:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    next(error)
  }
})

export default router

