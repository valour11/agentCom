import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  name: { type: String },
}, { timestamps: true });

const Contact = mongoose.model('Contact', contactSchema);
export default Contact;
