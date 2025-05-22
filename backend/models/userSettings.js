const mongoose = require('mongoose');

const userSettingsSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
    },
    notifications: {
        orderUpdates: {
            type: Boolean,
            default: true
        },
        promotions: {
            type: Boolean,
            default: true
        },
        productUpdates: {
            type: Boolean,
            default: true
        },
        email: {
            type: Boolean,
            default: true
        },
        inApp: {
            type: Boolean,
            default: true
        }
    },
    display: {
        itemsPerPage: {
            type: Number,
            default: 10,
            min: 5,
            max: 100
        },
        defaultView: {
            type: String,
            enum: ['list', 'grid'],
            default: 'list'
        }
    }
}, {
    timestamps: true
});

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);
module.exports = UserSettings;
