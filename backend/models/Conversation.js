import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  assignedAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  status: { type: String, default: 'active', enum: ['active', 'closed'] },
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
