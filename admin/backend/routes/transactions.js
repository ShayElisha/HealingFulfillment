import express from 'express'
import Transaction from '../models/Transaction.js'
import Customer from '../models/Customer.js'
import Purchase from '../models/Purchase.js'

const router = express.Router()

// GET /api/transactions - Get all transactions with filters
router.get('/', async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, customerId, limit = 100, page = 1 } = req.query
    
    console.log('📊 Fetching transactions with filters:', { type, category, startDate, endDate, customerId, limit, page })
    
    const query = {}
    
    if (type && type !== 'all') {
      query.type = type
    }
    
    if (category && category !== 'all') {
      query.category = category
    }
    
    if (startDate || endDate) {
      query.date = {}
      if (startDate) {
        query.date.$gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query.date.$lte = end
      }
    }
    
    if (customerId) {
      query.customer = customerId
    }
    
    console.log('📊 MongoDB query:', JSON.stringify(query, null, 2))
    
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const transactions = await Transaction.find(query)
      .populate('customer', 'name email phone')
      .populate({
        path: 'purchase',
        select: 'course price status customerName customerEmail',
        populate: {
          path: 'course',
          select: 'title price'
        }
      })
      .sort({ date: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean()
    
    const total = await Transaction.countDocuments(query)
    
    console.log(`✅ Found ${transactions.length} transactions (total: ${total})`)
    
    res.json({
      message: 'Transactions retrieved successfully',
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('❌ Error fetching transactions:', error)
    next(error)
  }
})

// GET /api/transactions/stats - Get financial statistics
router.get('/stats', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query
    
    const query = {}
    if (startDate || endDate) {
      query.date = {}
      if (startDate) {
        query.date.$gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query.date.$lte = end
      }
    }
    
    const [totalIncome, totalExpense, transactions] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...query, type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { ...query, type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.find(query).sort({ date: -1 }).limit(10).lean()
    ])
    
    const income = totalIncome[0]?.total || 0
    const expense = totalExpense[0]?.total || 0
    const balance = income - expense
    
    // Get income by category
    const incomeByCategory = await Transaction.aggregate([
      { $match: { ...query, type: 'income' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ])
    
    // Get expense by category
    const expenseByCategory = await Transaction.aggregate([
      { $match: { ...query, type: 'expense' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ])
    
    res.json({
      message: 'Financial statistics retrieved successfully',
      data: {
        totalIncome: income,
        totalExpense: expense,
        balance: balance,
        incomeByCategory,
        expenseByCategory,
        recentTransactions: transactions
      }
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/transactions/:id - Get single transaction
router.get('/:id', async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('purchase', 'course price status')
      .lean()
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' })
    }
    
    res.json({
      message: 'Transaction retrieved successfully',
      data: transaction
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/transactions - Create new transaction
router.post('/', async (req, res, next) => {
  try {
    console.log('📥 Creating transaction with data:', req.body)
    
    // Clean and prepare transaction data
    const transactionData = {
      type: req.body.type,
      category: req.body.category,
      amount: typeof req.body.amount === 'string' ? parseFloat(req.body.amount) : req.body.amount,
      description: req.body.description,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      paymentMethod: req.body.paymentMethod || 'bank_transfer',
      reference: req.body.reference || undefined,
      customer: req.body.customer && req.body.customer.trim() !== '' ? req.body.customer : null,
      purchase: req.body.purchase && req.body.purchase.trim() !== '' ? req.body.purchase : null,
      notes: req.body.notes || undefined,
      createdBy: req.body.createdBy || 'admin'
    }
    
    console.log('📥 Processed transaction data:', transactionData)
    
    const transaction = new Transaction(transactionData)
    await transaction.save()
    
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('customer', 'name email phone')
      .populate('purchase', 'course price status')
      .lean()
    
    res.status(201).json({
      message: 'Transaction created successfully',
      data: populatedTransaction
    })
  } catch (error) {
    console.error('❌ Error creating transaction:', error)
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
      console.error('❌ Validation errors:', validationErrors)
      return res.status(400).json({
        message: 'Validation error',
        errors: validationErrors.map(e => e.message),
        details: validationErrors
      })
    }
    next(error)
  }
})

// PUT /api/transactions/:id - Update transaction
router.put('/:id', async (req, res, next) => {
  try {
    const updateData = { ...req.body }
    
    if (updateData.date) {
      updateData.date = new Date(updateData.date)
    }
    
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('customer', 'name email phone')
      .populate('purchase', 'course price status')
      .lean()
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' })
    }
    
    res.json({
      message: 'Transaction updated successfully',
      data: transaction
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

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', async (req, res, next) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id)
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' })
    }
    
    res.json({
      message: 'Transaction deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

export default router

