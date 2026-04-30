import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;
const API_VERSION = process.env.API_VERSION || process.env.WHATSAPP_API_VERSION || 'v25.0';
const BASE_URL = `https://graph.facebook.com/v${API_VERSION.replace('v', '')}/${PHONE_NUMBER_ID}/messages`;

/**
 * Sends a text message via WhatsApp Cloud API
 * @param {string} to - Recipient phone number (with country code, no +)
 * @param {string} text - Message body
 * @returns {Promise<Object>} - WhatsApp API response
 */
export const sendWhatsAppMessage = async (to, text) => {
  try {
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      throw new Error('WhatsApp credentials not configured in .env');
    }

    const response = await axios.post(
      BASE_URL,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('WhatsApp Send Error:', error.response?.data || error.message);
    throw error;
  }
};
