const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the status history schema
const statusHistorySchema = new Schema({
  status: {
    type: String,
    enum: ["Pending", "Approved", "Shipped", "Delivered", "Cancelled"],
    required: true
  },
  notes: {
    type: String,
    default: ""
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const orderSchema = new Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // References User instead of Customer
        required: true,
    },
    customerInfo: {
        name: { type: String },
        email: { type: String },
        phone: { type: String },
        address: { type: String }
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            name: {
                type: String
            }
        },
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Shipped", "Delivered", "Cancelled"],
        default: "Pending",
    },
    paymentStatus: {
        type: String,
        enum: ["Unpaid", "Paid", "Partially Paid", "Refunded"],
        default: "Unpaid"
    },
    paymentMethod: {
        type: String,
        enum: ["Credit Card", "Cash", "Bank Transfer", "Other"],
        default: "Other"
    },
    notes: {
        type: String,
        default: ""
    },
    statusHistory: [statusHistorySchema],
    trackingNumber: {
        type: String
    },
    estimatedDelivery: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // employee, admin, or customer who created it
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // last user who updated the order
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Automatically manage createdAt and updatedAt
});

// Pre-save middleware to update the statusHistory
orderSchema.pre('save', function(next) {
    // If this is a new document or the status has changed
    if (this.isNew || this.isModified('status')) {
        // Add a new entry to the status history
        this.statusHistory.push({
            status: this.status,
            updatedBy: this.updatedBy || this.createdBy,
            notes: this.notes || ""
        });
    }
    next();
});

module.exports = mongoose.model("Order", orderSchema);