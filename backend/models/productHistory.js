const mongoose = require('mongoose');
const { Schema } = mongoose;

const productHistorySchema = new Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  changeType: {
    type: String,
    enum: ["created", "price", "quantity", "information", "status", "deleted"],
    required: true
  },
  previousValue: {
    type: Schema.Types.Mixed,
    default: null
  },
  newValue: {
    type: Schema.Types.Mixed,
    default: null
  },
  field: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ""
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
productHistorySchema.index({ product: 1, timestamp: -1 });
productHistorySchema.index({ user: 1 });
productHistorySchema.index({ changeType: 1 });

module.exports = mongoose.model("ProductHistory", productHistorySchema);
