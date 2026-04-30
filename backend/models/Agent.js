import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'agent'], default: 'agent' },
}, { timestamps: true });

const Agent = mongoose.model('Agent', agentSchema);
export default Agent;
