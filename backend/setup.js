const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

async function setupInitialData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://developertag2025:xjs0pGQzmmNqxFdD@cluster0.5oapkgv.mongodb.net/?appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create initial admin user
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@company.com',
      password: 'admin123', // This will be hashed by the pre-save middleware
      role: 'admin',
      isActive: true,
      profile: {
        phone: '+1234567890',
        department: 'IT',
        position: 'System Administrator'
      }
    });

    await adminUser.save();
    console.log('✅ Initial admin user created successfully!');
    console.log('📧 Email: admin@company.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run setup
setupInitialData();
