require('dotenv').config();
const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/buildmart';

// Define Product model
const productSchema = new mongoose.Schema({
    name: String,
    category: String,
    price: Number,
    stock: Number,
    description: String,
    imageUrl: String
});

const Product = mongoose.model('Product', productSchema);

// Sample product data
const sampleProducts = [
    {
        name: 'Ultra Premium Cement',
        category: 'Cement',
        price: 350,
        stock: 500,
        description: 'High-quality OPC cement suitable for all structural applications. Provides excellent strength and durability.',
        imageUrl: 'https://images.unsplash.com/photo-1518228119633-24141e921161?auto=format&fit=crop&q=80'
    },
    {
        name: 'Weather Shield Cement',
        category: 'Cement',
        price: 420,
        stock: 350,
        description: 'Specially formulated cement that offers protection against extreme weather conditions.',
        imageUrl: 'https://images.unsplash.com/photo-1597484661973-ee6cd0b6482c?auto=format&fit=crop&q=80'
    },
    {
        name: 'Quick Set Cement',
        category: 'Cement',
        price: 380,
        stock: 200,
        description: 'Fast-setting cement ideal for repair work and applications requiring rapid hardening.',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&q=80'
    },
    {
        name: 'Clay Bricks (Standard)',
        category: 'Bricks',
        price: 8,
        stock: 10000,
        description: 'Standard size red clay bricks with excellent thermal insulation properties. Perfect for walls and facades.',
        imageUrl: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&q=80'
    },
    {
        name: 'Fly Ash Bricks',
        category: 'Bricks',
        price: 9,
        stock: 8000,
        description: 'Eco-friendly bricks made with fly ash. Offers better strength and uniform shape compared to clay bricks.',
        imageUrl: 'https://images.unsplash.com/photo-1596079890744-c1a0462d0975?auto=format&fit=crop&q=80'
    },
    {
        name: 'TMT Steel Bars (10mm)',
        category: 'Steel',
        price: 62,
        stock: 1000,
        description: '10mm diameter TMT steel reinforcement bars for concrete structures. Provides high tensile strength and ductility.',
        imageUrl: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&q=80'
    },
    {
        name: 'TMT Steel Bars (16mm)',
        category: 'Steel',
        price: 80,
        stock: 800,
        description: '16mm diameter high-grade TMT steel reinforcement bars for heavy-duty structural applications.',
        imageUrl: 'https://images.unsplash.com/photo-1573661533699-a73d377893b3?auto=format&fit=crop&q=80'
    },
    {
        name: 'River Sand (Fine)',
        category: 'Sand',
        price: 55,
        stock: 2000,
        description: 'Fine-grained natural river sand, thoroughly cleaned and sieved. Ideal for plaster work and fine concrete.',
        imageUrl: 'https://images.unsplash.com/photo-1598884144318-3d4d7acea388?auto=format&fit=crop&q=80'
    },
    {
        name: 'Coarse Sand',
        category: 'Sand',
        price: 45,
        stock: 3000,
        description: 'Coarse-grained sand suitable for concrete preparation and masonry work.',
        imageUrl: 'https://images.unsplash.com/photo-1617692855027-33b14f061079?auto=format&fit=crop&q=80'
    },
    {
        name: 'Aggregate (20mm)',
        category: 'Aggregate',
        price: 35,
        stock: 5000,
        description: '20mm crushed stone aggregate for concrete preparation. Provides excellent strength and workability.',
        imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80'
    },
    {
        name: 'White Marble Chips',
        category: 'Aggregate',
        price: 65,
        stock: 500,
        description: 'Premium white marble chips for decorative flooring and landscaping applications.',
        imageUrl: 'https://images.unsplash.com/photo-1517329782449-810562a4ec2f?auto=format&fit=crop&q=80'
    },
    {
        name: 'Waterproofing Compound',
        category: 'Chemicals',
        price: 420,
        stock: 150,
        description: 'Advanced waterproofing compound for bathrooms, basements, and roofs. Prevents water leakage and dampness.',
        imageUrl: 'https://images.unsplash.com/photo-1574435903046-33fe2916e073?auto=format&fit=crop&q=80'
    },
    {
        name: 'Concrete Admixture',
        category: 'Chemicals',
        price: 380,
        stock: 200,
        description: 'High-performance concrete admixture that improves workability, strength, and setting time.',
        imageUrl: 'https://images.unsplash.com/photo-1629142085100-cfd1a7b4899a?auto=format&fit=crop&q=80'
    },
    {
        name: 'Premium Exterior Paint (20L)',
        category: 'Paints',
        price: 2500,
        stock: 100,
        description: 'Weather-resistant exterior paint with UV protection. Available in various colors.',
        imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80'
    },
    {
        name: 'Interior Emulsion Paint (10L)',
        category: 'Paints',
        price: 1800,
        stock: 120,
        description: 'Premium interior emulsion paint with smooth finish and low VOC content.',
        imageUrl: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&q=80'
    }
];

async function createSampleProducts() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            family: 4 // Force IPv4
        });
        console.log('Connected to MongoDB');

        // Check if products already exist
        const existingCount = await Product.countDocuments();
        if (existingCount > 0) {
            console.log(`Database already has ${existingCount} products. Skipping sample data creation.`);
            console.log('To reset sample data, use --force flag');
            
            // If --force flag is provided, delete existing products and recreate
            if (process.argv.includes('--force')) {
                console.log('Force flag detected. Deleting existing products...');
                await Product.deleteMany({});
                console.log('Existing products deleted.');
            } else {
                return true;
            }
        }

        // Create sample products
        await Product.create(sampleProducts);
        console.log(`Successfully added ${sampleProducts.length} sample products to the database`);
        return true;
    } catch (error) {
        console.error('Error creating sample products:', error);
        return false;
    } finally {
        try {
            await mongoose.connection.close();
            console.log('MongoDB connection closed');
        } catch (err) {
            console.error('Error closing MongoDB connection:', err);
        }
    }
}

// Run if invoked directly
if (require.main === module) {
    createSampleProducts()
        .then((result) => {
            console.log(result ? 'Script completed successfully' : 'Script failed');
            process.exit(result ? 0 : 1);
        })
        .catch(err => {
            console.error('Unhandled error:', err);
            process.exit(1);
        });
}

module.exports = { createSampleProducts }; 