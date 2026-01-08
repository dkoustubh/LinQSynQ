const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    user: { type: String, required: true },
    action: { type: String, required: true }, // LOGIN, ADD_TAG, WRITE_TAG, etc.
    details: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed } // Flexible storage for extra info
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
