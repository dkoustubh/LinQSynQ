const mongoose = require('mongoose');

const TagMetadataSchema = new mongoose.Schema({
    tagName: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    datatype: { type: String },
    description: { type: String },
    owner: { type: String }, // User who created it
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TagMetadata', TagMetadataSchema);
