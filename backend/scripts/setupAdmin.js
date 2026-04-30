import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Agent from '../models/Agent.js';

dotenv.config();

const setupAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'whatsapp'
    });
    console.log('Connected to MongoDB');

    const adminExists = await Agent.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = new Agent({
      name: 'SuperAdmin',
      password: hashedPassword,
      role: 'admin',
    });

    await admin.save();
    console.log('Admin user created successfully.');
    console.log('Name: SuperAdmin');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

setupAdmin();
