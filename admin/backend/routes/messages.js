import express from 'express'
import Message from '../models/Message.js'
import Customer from '../models/Customer.js'
import { sendEmail, getBaseTemplate } from '../services/emailService.js'

const router = express.Router()

// GET /api/messages - Get all messages (admin); ?page=&limit= לעימוד
router.get('/', async (req, res, next) => {
  try {
    const usePaging = req.query.page !== undefined || req.query.limit !== undefined
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(150, Math.max(1, parseInt(req.query.limit, 10) || 50))
    const skip = (page - 1) * limit

    let query = Message.find().populate('recipients', 'name email phone').sort({ createdAt: -1 })
    if (usePaging) {
      query = query.skip(skip).limit(limit)
    }

    const [messages, total] = await Promise.all([
      query.lean(),
      usePaging ? Message.countDocuments({}) : Promise.resolve(0),
    ])

    const messagesWithSafeData = messages.map((msg) => ({
      ...msg,
      sendResults: Array.isArray(msg.sendResults) ? msg.sendResults : [],
      recipients: Array.isArray(msg.recipients) ? msg.recipients : [],
      channels: Array.isArray(msg.channels) ? msg.channels : [],
    }))

    res.json({
      message: 'Messages retrieved successfully',
      data: messagesWithSafeData,
      ...(usePaging && {
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
      }),
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    next(error)
  }
})

// POST /api/messages - Send messages to multiple customers
router.post('/', async (req, res, next) => {
  try {
    const { recipientIds, subject, content, channels } = req.body

    // Validation
    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({ message: 'Recipients are required' })
    }
    if (!subject || !content) {
      return res.status(400).json({ message: 'Subject and content are required' })
    }
    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return res.status(400).json({ message: 'At least one channel is required' })
    }

    // Validate channels
    const validChannels = ['email', 'system']
    const invalidChannels = channels.filter(ch => !validChannels.includes(ch))
    if (invalidChannels.length > 0) {
      return res.status(400).json({ message: `Invalid channels: ${invalidChannels.join(', ')}` })
    }

    // Get recipients
    const recipients = await Customer.find({ _id: { $in: recipientIds } })
    if (recipients.length === 0) {
      return res.status(400).json({ message: 'No valid recipients found' })
    }

    // Create message record
    const message = new Message({
      recipients: recipientIds,
      subject,
      content,
      channels,
      status: 'pending',
      createdBy: 'admin'
    })

    await message.save()

    // Send messages asynchronously
    sendMessagesAsync(message, recipients, channels).catch(error => {
      console.error('Error sending messages:', error)
    })

    res.status(201).json({
      message: 'Message created and sending started',
      data: {
        id: message._id,
        recipientsCount: recipients.length,
        channels
      }
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/messages/:id - Get message by ID
router.get('/:id', async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('recipients', 'name email phone')
      .lean()

    if (!message) {
      return res.status(404).json({ message: 'Message not found' })
    }

    res.json({
      message: 'Message retrieved successfully',
      data: message
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/messages/customer/:customerId - Get messages for a specific customer
router.get('/customer/:customerId', async (req, res, next) => {
  try {
    const messages = await Message.find({
      recipients: req.params.customerId
    })
      .populate('recipients', 'name email phone')
      .sort({ createdAt: -1 })
      .lean()

    res.json({
      message: 'Customer messages retrieved successfully',
      data: messages
    })
  } catch (error) {
    next(error)
  }
})

// Helper function to send messages asynchronously
async function sendMessagesAsync(message, recipients, channels) {
  const sendResults = []
  let successCount = 0
  let failCount = 0

  // Update status to sending
  await Message.findByIdAndUpdate(message._id, { status: 'sending' })

  for (const recipient of recipients) {
    for (const channel of channels) {
      const result = {
        customer: recipient._id,
        channel,
        status: 'pending',
        sentAt: null
      }

      try {
        if (channel === 'email') {
          if (recipient.email) {
            const emailResult = await sendEmail({
              to: recipient.email,
              subject: message.subject,
              html: getBaseTemplate(message.subject, message.content.replace(/\n/g, '<br>'))
            })
            
            if (emailResult.success) {
              result.status = 'sent'
              result.sentAt = new Date()
              successCount++
            } else {
              result.status = 'failed'
              result.error = emailResult.error || 'Unknown error'
              failCount++
            }
          } else {
            result.status = 'failed'
            result.error = 'No email address'
            failCount++
          }
        } else if (channel === 'system') {
          // System message - saved in customer's messages array
          // The message is already saved in the Message collection
          // We just need to mark it as sent for system channel
          result.status = 'sent'
          result.sentAt = new Date()
          successCount++
        }

        sendResults.push(result)
      } catch (error) {
        result.status = 'failed'
        result.error = error.message
        failCount++
        sendResults.push(result)
      }
    }
  }

  // Update message with results
  const finalStatus = failCount === 0 ? 'sent' : (successCount === 0 ? 'failed' : 'partially_sent')
  await Message.findByIdAndUpdate(message._id, {
    status: finalStatus,
    sendResults,
    sentAt: new Date()
  })
}

export default router

