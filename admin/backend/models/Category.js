import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  symptoms: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  copingMethods: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  therapeuticApproach: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  purchaseCTA: {
    type: String,
    trim: true,
    maxlength: [200, 'CTA cannot exceed 200 characters'],
    default: 'מוכן להתחיל את המסע? קבע פגישה או רכוש את המסלול המלא'
  },
  videos: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    duration: {
      type: Number // in seconds
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  files: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['image', 'pdf', 'document', 'video', 'other'],
      default: 'video'
    },
    size: {
      type: Number // in bytes
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Convert old string therapeuticApproach to array format
categorySchema.pre('save', function(next) {
  try {
    this.updatedAt = Date.now()
    
    // Convert therapeuticApproach from string to array if needed
    if (this.therapeuticApproach && typeof this.therapeuticApproach === 'string' && this.therapeuticApproach.trim() !== '') {
      this.therapeuticApproach = [this.therapeuticApproach]
    } else if (!Array.isArray(this.therapeuticApproach)) {
      this.therapeuticApproach = []
    }
    
    // Ensure symptoms and copingMethods are arrays
    if (!Array.isArray(this.symptoms)) {
      this.symptoms = []
    }
    if (!Array.isArray(this.copingMethods)) {
      this.copingMethods = []
    }
    
    next()
  } catch (error) {
    console.error('Error in pre-save hook:', error)
    next(error)
  }
})

const Category = mongoose.model('Category', categorySchema)

export default Category

