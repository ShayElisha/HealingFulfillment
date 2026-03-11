import express from 'express'
import Category from '../models/Category.js'

const router = express.Router()

// GET /api/categories - Get all active categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean()
    
    // Normalize arrays
    const normalizedCategories = categories.map(cat => ({
      ...cat,
      therapeuticApproach: Array.isArray(cat.therapeuticApproach) 
        ? cat.therapeuticApproach 
        : (cat.therapeuticApproach ? [cat.therapeuticApproach] : []),
      symptoms: Array.isArray(cat.symptoms) ? cat.symptoms : [],
      copingMethods: Array.isArray(cat.copingMethods) ? cat.copingMethods : []
    }))
    
    res.json({
      message: 'Categories retrieved successfully',
      data: normalizedCategories
    })
  } catch (error) {
    console.error('Error fetching categories:', error.message)
    res.status(500).json({
      message: 'Failed to fetch categories',
      error: error.message
    })
  }
})

// GET /api/categories/:id - Get single category with all details
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      isActive: true
    }).lean()
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }
    
    // Normalize arrays
    const normalizedCategory = {
      ...category,
      therapeuticApproach: Array.isArray(category.therapeuticApproach) 
        ? category.therapeuticApproach 
        : (category.therapeuticApproach ? [category.therapeuticApproach] : []),
      symptoms: Array.isArray(category.symptoms) ? category.symptoms : [],
      copingMethods: Array.isArray(category.copingMethods) ? category.copingMethods : []
    }
    
    res.json({
      message: 'Category retrieved successfully',
      data: { category: normalizedCategory }
    })
  } catch (error) {
    console.error('Error fetching category:', error.message)
    res.status(500).json({
      message: 'Failed to fetch category',
      error: error.message
    })
  }
})

export default router

