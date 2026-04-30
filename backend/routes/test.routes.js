import express from 'express';
import dotenv from 'dotenv';
import { io } from '../server.js';
import { sendWhatsAppMessage } from '../services/whatsapp.service.js';
import Contact from '../models/Contact.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

dotenv.config();

const router = express.Router();

router.post('/test-webhook', async (req, res) => {
  const body = req.body;

  console.log('Received webhook:', JSON.stringify(body, null, 2));

  try {
    // Simulate the webhook processing
    const message = body.entry[0].changes[0].value.messages[0];
    const from = message.from;
    const text = message.text?.body;
    const whatsappId = message.id;

    console.log(`Processing message from ${from}: ${text}`);

    // 1. Find or create contact
    let contact = await Contact.findOne({ phoneNumber: from });
    console.log('Contact found/created:', contact);

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
      io.emit('NEW_CONVERSATION', conversation);
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
      id: conversation._id,
      lastMessage: formattedMessage,
    });

    return res.sendStatus(200);
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.sendStatus(500);
  }
});

export default router;