require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const { body, validationResult } = require('express-validator');

const app = express();

require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Updated CORS configuration
app.use(cors({
    origin: 'http://127.0.0.1:5500', // Add your frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Ensure these middleware are properly set
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add this after your existing middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    if (process.env.NODE_ENV === 'production') {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
        const origin = req.headers.origin;
        if (origin && allowedOrigins.includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
        }
    } else {
        res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Serve static files from the root directory
app.use(express.static(__dirname));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Admin route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'admin.html'));
});

// MongoDB connection with error handling
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB Atlas');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Add error handlers for MongoDB connection
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting to reconnect...');
});

// Models
const User = mongoose.model('User', {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

const Activity = mongoose.model('Activity', {
    userId: mongoose.Schema.Types.ObjectId,
    action: String,
    details: Object,
    timestamp: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    description: String,
    imageUrl: String,
    createdAt: { type: Date, default: Date.now }
});

// Add Order model
const Order = mongoose.model('Order', {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    customerName: String,
    productName: String,
    quantity: Number,
    amount: Number,
    status: { 
        type: String, 
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    createdAt: { type: Date, default: Date.now }
});

// Updated Contact model with proper schema
const Contact = mongoose.model('Contact', {
    name: { 
        type: String, 
        required: true,
        trim: true 
    },
    email: { 
        type: String, 
        required: true,
        trim: true,
        lowercase: true
    },
    phone: { 
        type: String, 
        required: true,
        trim: true 
    },
    message: { 
        type: String, 
        required: true,
        trim: true 
    },
    status: { 
        type: String, 
        default: 'unread',
        enum: ['read', 'unread'] 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Add RefreshToken model
const RefreshToken = mongoose.model('RefreshToken', {
    token: String,
    userId: mongoose.Schema.Types.ObjectId,
    expires: Date
});

// Update Authentication Middleware
const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        console.log('Auth header:', authHeader);
        
        if (!authHeader) {
            throw new Error('No authorization header');
        }
        
        // Handle token format correctly - with or without Bearer prefix
        let token;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
        } else if (authHeader.startsWith('Bearer')) { // In case of malformed but close
            token = authHeader.replace('Bearer', '').trim();
        } else {
            token = authHeader; // Just use as is
        }
        
        if (!token) {
            throw new Error('Empty token');
        }
        
        console.log('Processing token:', token.substring(0, 10) + '...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            throw new Error('User not found');
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        res.status(401).json({ error: 'Please authenticate properly.' });
    }
};

// Add admin middleware
const adminAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user || user.role !== 'admin') {
            throw new Error();
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Admin access required' });
    }
};

// Activity Logger
const logActivity = async (userId, action, details) => {
    try {
        await Activity.create({ userId, action, details });
    } catch (error) {
        console.error('Activity logging failed:', error);
    }
};

// Contact form validation rules
const contactValidationRules = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('message').trim().notEmpty().withMessage('Message is required')
];

// Validation Rules
const userValidationRules = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty()
];

// Token configuration
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Routes   
// Auth Routes    
// Update registration route with better error handling
app.post('/api/register', userValidationRules, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                message: errors.array()[0].msg 
            });
        }

        const { name, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                error: 'User exists', 
                message: 'Email is already registered' 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ 
            name, 
            email, 
            password: hashedPassword 
        });
        
        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );
        
        await logActivity(user._id, 'REGISTER', { email });
        
        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token: `Bearer ${token}`
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Server error', 
            message: 'Failed to register user' 
        });
    }
});

// Updated login route
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for:', email);

        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Invalid password for:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'buildmartsecret',
            { expiresIn: '1d' }
        );

        // Log success
        console.log('Login successful for:', email);

        // Send response
        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token: `Bearer ${token}`
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add refresh token endpoint
app.post('/api/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return res.status(401).json({ error: 'No refresh token' });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        // Check if token exists in database     
        const storedToken = await RefreshToken.findOne({
            token: refreshToken,
            userId: decoded.userId
        });
        
        if (!storedToken || storedToken.expires < new Date()) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
        
        // Generate new access token
        const accessToken = jwt.sign(
            { userId: decoded.userId },
            process.env.JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRY }
        );
        
        res.json({
            token: accessToken, // No prefix - frontend handles it
            expiresIn: 900 // 15 minutes in seconds
        });
    } catch (error) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

// Add logout endpoint
app.post('/api/logout', auth, async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        
        if (refreshToken) {
            await RefreshToken.deleteOne({ token: refreshToken });
        }
        
        res.clearCookie('refreshToken');
        await logActivity(req.user._id, 'LOGOUT', {});
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Product Routes
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching products' });
    }
});

app.post('/api/products', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const product = await Product.create(req.body);
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: 'Error creating product' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching product' });
    }
});

app.put('/api/products/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Error updating product' });
    }
});

app.delete('/api/products/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting product' });
    }
});

// User Management Routes
app.get('/api/users', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Add admin promotion route
app.post('/api/users/promote', adminAuth, async (req, res) => {
    try {
        const { userId } = req.body;
        // Only super admin can promote others
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role: 'admin' },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        await logActivity(req.user._id, 'PROMOTE_ADMIN', { promotedUser: userId });
        res.json({ message: 'User promoted to admin', user });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Activity Routes
app.get('/api/activities', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        const activities = await Activity.find()
            .sort({ timestamp: -1 })
            .limit(100);
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Contact Routes
app.post('/api/contact', contactValidationRules, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, phone, message } = req.body;
        
        const contact = await Contact.create({
            name,
            email,
            phone,
            message,
            status: 'unread',
            createdAt: new Date()
        });

        await logActivity(null, 'NEW_CONTACT', { contactId: contact._id });

        res.status(201).json({
            success: true,
            message: 'Inquiry submitted successfully',
            contact
        });
    } catch (error) {
        console.error('Contact submission error:', error);
        res.status(500).json({ 
            error: 'Failed to submit inquiry',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.get('/api/contacts', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update contact status
app.put('/api/contacts/:id/status', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { id } = req.params;
        const { status } = req.body;

        const contact = await Contact.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({ error: 'Inquiry not found' });
        }

        await logActivity(req.user._id, 'UPDATE_CONTACT_STATUS', { 
            contactId: id, 
            newStatus: status 
        });

        res.json(contact);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete contact
app.delete('/api/contacts/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { id } = req.params;
        const contact = await Contact.findByIdAndDelete(id);

        if (!contact) {
            return res.status(404).json({ error: 'Inquiry not found' });
        }

        await logActivity(req.user._id, 'DELETE_CONTACT', { contactId: id });
        res.json({ message: 'Inquiry deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Add admin check route
app.get('/api/check-admin', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        res.json({ isAdmin: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Add verify-admin endpoint
app.get('/api/verify-admin', auth, async (req, res) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ 
                isAdmin: false,
                message: 'User is not an admin' 
            });
        }
        res.json({ 
            isAdmin: true,
            user: {
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Dashboard Stats Route
// Keep this one and remove the duplicate
app.get('/api/dashboard-stats', auth, async (req, res) => {
    try {
        // Verify admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Fetch all required stats
        const totalSales = await Order.aggregate([
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const stats = {
            totalSales: totalSales[0]?.total || 0,
            totalOrders: await Order.countDocuments(),
            totalProducts: await Product.countDocuments(),
            activeUsers: await User.countDocuments({ status: 'active' }),
            recentOrders: await Order.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('userId', 'name')
                .populate('productId', 'name price')
        };

        res.json(stats);
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// Verify admin status
app.get('/api/verify-admin', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            throw new Error('Not authorized');
        }
        res.json({ status: 'success' });
    } catch (error) {
        res.status(403).json({ error: 'Not authorized' });
    }
});

// Section specific data routes
app.get('/api/admin/:section', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { section } = req.params;
        let data = [];

        switch(section) {
            case 'products':
                data = await Product.find().sort({ createdAt: -1 });
                break;
            case 'orders':
                data = await Order.find()
                    .populate('userId')
                    .populate('productId')
                    .sort({ createdAt: -1 });
                break;
            case 'users':
                data = await User.find()
                    .select('-password')
                    .sort({ createdAt: -1 });
                break;
            case 'settings':
                // Return empty data or default settings
                data = {};
                break;
            default:
                throw new Error('Invalid section');
        }

        res.json(data);
    } catch (error) {
        console.error(`Section data error:`, error);
        res.status(500).json({ error: 'Failed to fetch section data' });
    }
});
// Debug endpoint to check user role
app.get('/api/debug/check-role', auth, (req, res) => {
    try {
        const user = req.user;
        const token = req.token;
        
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token: {
                valid: true,
                prefix: token.startsWith('Bearer ') ? 'Has Bearer prefix' : 'Missing Bearer prefix',
                decoded: jwt.decode(token.replace('Bearer ', ''))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        status: 404,
        error: 'Not found',
        message: 'The requested resource was not found'
    });
});

// Start server with error handling
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please use a different port.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully');
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
    });
});
