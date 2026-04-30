import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderType: { type: String, required: true, enum: ['agent', 'client'] },
  messageBody: { type: String, required: true },
  status: { type: String, default: 'sent', enum: ['sending', 'sent', 'delivered', 'failed', 'read'] },
  whatsappId: { type: String, sparse: true, unique: true },
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
