import express from 'express'
import Blog from '../models/Blog.js'

const router = express.Router()

// GET /api/blog - Get all published blog posts
router.get('/', async (req, res, next) => {
  try {
    const posts = await Blog.find({ published: true })
      .sort({ createdAt: -1 })
      .select('title slug excerpt createdAt')
    
    res.json({
      message: 'Blog posts retrieved successfully',
      data: posts
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/blog/:slug - Get single blog post by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const post = await Blog.findOne({ 
      slug: req.params.slug,
      published: true 
    })
    
    if (!post) {
      return res.status(404).json({
        message: 'Blog post not found'
      })
    }
    
    res.json({
      message: 'Blog post retrieved successfully',
      data: post
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/blog - Create new blog post (admin only - add auth middleware in production)
router.post('/', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    const blog = new Blog(req.body)
    await blog.save()
    
    res.status(201).json({
      message: 'Blog post created successfully',
      data: blog
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Blog post with this slug already exists'
      })
    }
    next(error)
  }
})

export default router

