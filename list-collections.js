const mongoose = require('mongoose');

const checkCollections = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/fuseflow');
        console.log('Connected to MongoDB.');

        const collections = await mongoose.connection.db.listCollections().toArray();

        console.log('\n📂 Collections (Tables) in "fuseflow" database:');
        console.log('------------------------------------------------');
        if (collections.length === 0) {
            console.log('No collections found.');
        } else {
            collections.forEach(col => {
                console.log(`- ${col.name}`);
            });
        }
        console.log('------------------------------------------------\n');

        // Count documents in each
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`Command to view ${col.name}: db.${col.name}.find().pretty() (Count: ${count})`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
};

checkCollections();
