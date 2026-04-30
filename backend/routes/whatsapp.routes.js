import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { io } from '../server.js';
import { sendWhatsAppMessage } from '../services/whatsapp.service.js';
import { protect } from '../middleware/auth.middleware.js';
import Contact from '../models/Contact.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Agent from '../models/Agent.js';

dotenv.config();

const router = express.Router();
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

/**
 * Webhook Verification (GET)
 * Used by Meta to verify the endpoint
 */
router.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
});

/**
 * Handle Incoming Webhook Events (POST)
 */
router.post('/webhook/whatsapp', async (req, res) => {
  const body = req.body;

  // Check if it's a WhatsApp event
  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from; // Phone number
      const text = message.text?.body;
      const whatsappId = message.id;

      console.log(`Incoming message from ${from}: ${text}`);

      try {
        console.log(`Processing message from ${from}: ${text}`);

        // 0. Check if message already exists (Meta retry mechanism)
        const existingMessage = await Message.findOne({ whatsappId });
        if (existingMessage) {
          console.log(`Message ${whatsappId} already processed. Skipping retry.`);
          return res.sendStatus(200);
        }

        // 1. Find or create contact
        let contact = await Contact.findOne({ phoneNumber: from });
        console.log('Contact found:', contact);

        if (!contact) {
          contact = new Contact({ phoneNumber: from });
          await contact.save();
          console.log('New contact saved:', contact);
        }

        // 2. Find or create active conversation
        let conversation = await Conversation.findOne({
          contactId: contact._id,
          status: 'active',
        });
        console.log('Conversation found:', conversation);

        if (!conversation) {
          conversation = new Conversation({
            contactId: contact._id,
          });
          await conversation.save();
          console.log('New conversation saved:', conversation);
          
          const formattedConv = {
            ...conversation.toObject(),
            id: conversation._id.toString(),
            contact: {
              ...contact.toObject(),
              id: contact._id.toString(),
            },
            contactId: undefined,
          };
          
          io.emit('NEW_CONVERSATION', formattedConv);
        }

        // 3. Save message
        const newMessage = new Message({
          conversationId: conversation._id,
          senderType: 'client',
          messageBody: text || '[Non-text message]',
          whatsappId: whatsappId,
          status: 'delivered',
        });
        await newMessage.save();
        console.log('Message saved:', newMessage);

        // 4. Emit real-time event
        const formattedMessage = {
          ...newMessage.toObject(),
          id: newMessage._id,
          conversationId: newMessage.conversationId.toString(),
        };

        console.log('Emitting to room:', conversation._id.toString());
        io.to(conversation._id.toString()).emit('NEW_MESSAGE', formattedMessage);

        io.emit('UPDATE_CONVERSATION', {
          id: conversation._id.toString(),
          lastMessage: formattedMessage,
        });

        return res.sendStatus(200);
      } catch (error) {
        console.error('Error processing webhook:', error);
        return res.sendStatus(500);
      }
    }
    return res.sendStatus(200);
  } else {
    return res.sendStatus(404);
  }
});

/**
 * Send Message API
 */
router.post('/messages/send', async (req, res) => {
  const { agentId, phoneNumber, messageBody } = req.body;

  if (!phoneNumber || !messageBody) {
    return res.status(400).json({ error: 'Missing phone number or message body' });
  }

  try {
    // 1. Find or create contact
    let contact = await Contact.findOne({ phoneNumber });

    if (!contact) {
      contact = await Contact.create({ phoneNumber });
    }

    // Handle mock agentId from frontend
    const validAgentId = agentId && mongoose.Types.ObjectId.isValid(agentId) ? agentId : undefined;

    // 2. Find or create active conversation
    let conversation = await Conversation.findOne({
      contactId: contact._id,
      status: 'active',
    });

    if (!conversation) {
      conversation = await Conversation.create({
        contactId: contact._id,
        assignedAgentId: validAgentId,
      });
    }

    // 3. Save message with 'sending' status
    const message = await Message.create({
      conversationId: conversation._id,
      senderType: 'agent',
      messageBody,
      status: 'sending',
    });

    // 4. Call WhatsApp API
    const waResponse = await sendWhatsAppMessage(phoneNumber, messageBody);
    const waId = waResponse.messages[0].id;

    // 5. Update message status
    const updatedMessage = await Message.findByIdAndUpdate(
      message._id,
      {
        status: 'sent',
        whatsappId: waId,
      },
      { new: true }
    );

    // 6. Emit real-time event
    const formattedMessage = {
      ...updatedMessage.toObject(),
      id: updatedMessage._id,
      conversationId: updatedMessage.conversationId.toString(),
    };
    
    io.to(conversation._id.toString()).emit('NEW_MESSAGE', formattedMessage);

    return res.status(200).json(formattedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * Get all conversations
 */
router.get('/conversations', protect, async (req, res) => {
  const agent = req.agent;

  try {
    let query = {};
    if (agent.role === 'admin') {
      // Admins see all conversations
      query = {};
    } else {
      // Agents see their assigned conversations and unassigned ones
      query = {
        $or: [
          { assignedAgentId: agent._id.toString() },
          { assignedAgentId: null }
        ]
      };
    }

    const conversations = await Conversation.find(query)
      .populate('contactId')
      .sort({ updatedAt: -1 })
      .lean();

    // Map to include lastMessage field and rename contactId to contact for convenience
    const formattedConversations = await Promise.all(
      conversations.map(async (c) => {
        const lastMessage = await Message.findOne({ conversationId: c._id })
          .sort({ createdAt: -1 })
          .lean();
        
        return {
          ...c,
          id: c._id,
          contact: c.contactId ? { ...c.contactId, id: c.contactId._id } : null,
          contactId: undefined,
          lastMessage: lastMessage ? { ...lastMessage, id: lastMessage._id } : null
        };
      })
    );

    return res.status(200).json(formattedConversations);
  } catch (error) {
    console.error('Fetch conversations error:', error);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * Get messages for a conversation
 */
router.get('/messages/:conversationId', protect, async (req, res) => {
  const { conversationId } = req.params;
  const agent = req.agent;

  try {
    // Check if agent has access to this conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (agent.role !== 'admin' && 
        conversation.assignedAgentId && 
        conversation.assignedAgentId.toString() !== agent._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    const formattedMessages = messages.map(m => ({ ...m, id: m._id }));

    return res.status(200).json(formattedMessages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * Assign conversation to agent
 */
router.post('/conversations/:id/assign', protect, async (req, res) => {
  const { id } = req.params;
  const { agentId } = req.body;
  const agent = req.agent;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid conversation ID' });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid conversation ID' });
  }

  // Agents claim for themselves, admins can assign any agent
  let targetAgentId;
  if (agent.role === 'admin') {
    targetAgentId = agentId && mongoose.Types.ObjectId.isValid(agentId) ? agentId : null;
  } else {
    targetAgentId = agent._id;
  }

  try {
    const conversation = await Conversation.findByIdAndUpdate(
      id,
      { assignedAgentId: targetAgentId },
      { new: true }
    ).populate('contactId').lean();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const formattedConversation = {
      ...conversation,
      id: conversation._id,
      contact: conversation.contactId ? { ...conversation.contactId, id: conversation.contactId._id } : null,
      contactId: undefined
    };

    io.emit('UPDATE_CONVERSATION', {
      id: formattedConversation.id,
      assignedAgentId: targetAgentId
    });

    return res.status(200).json(formattedConversation);
  } catch (error) {
    console.error('Assign conversation error:', error);
    return res.status(500).json({ error: 'Failed to assign conversation' });
  }
});

export default router;
