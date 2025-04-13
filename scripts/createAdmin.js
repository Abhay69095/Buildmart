require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/buildmart';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@buildmart.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin User';

// Define User model
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        console.log('Using URI:', MONGODB_URI);
        
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB Atlas successfully');

        // Check if admin exists
        console.log('Checking for existing admin...');
        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
        
        if (existingAdmin) {
            console.log('Admin user already exists:', {
                id: existingAdmin._id,
                email: existingAdmin.email,
                role: existingAdmin.role,
                createdAt: existingAdmin.createdAt
            });
            return;
        }

        // Create new admin
        console.log('Creating new admin user...');
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
        
        const adminUser = await User.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: 'admin'
        });

        console.log('Admin user created successfully:', {
            id: adminUser._id,
            email: adminUser.email,
            role: adminUser.role,
            createdAt: adminUser.createdAt
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run if invoked directly
if (require.main === module) {
    createAdminUser()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Fatal error:', err);
            process.exit(1);
        });
}

module.exports = { createAdminUser };
