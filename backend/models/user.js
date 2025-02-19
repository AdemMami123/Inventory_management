const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match:[
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please fill a valid email address'
        ]
    },
    password: {
        type: String,
        required: true,
        minlenght: [6, 'Password must be at least 6 characters long']
    },
    photo: {
        type: String,
        required: [true,"please upload a photo"],
        default:"https://i.ibb.co/4pDNDk1/avatar.png"
    },
    phone: {
        type: String,
       default:"+216"
    },
    bio: {
        type: String,
        maxlenght: [250, 'Bio must be at most 250 characters long'],
        default:"bio"
    },
    role:{
        type: String,
        enum: ['admin', 'manager','employee'],
        default: 'employee'
    }
    

},
    {
        timestamps: true
    }
);
//hash password before saving in database
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword; 
    next();
    
})

const User= mongoose.model('User', userSchema)
module.exports = User;


