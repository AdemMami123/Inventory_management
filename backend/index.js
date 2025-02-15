require('dotenv').config(); 

const bodyParser = require('body-parser');
const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require('./routes/userRoutes');
const productRoute = require('./routes/productRoute');
const errorHandler = require('./middleware/errorMiddleware');
const cookieParser = require('cookie-parser');
const cors = require("cors");
const fs = require("fs");
const path = require("path"); 

const app = express();

// Enable CORS
app.use(cors({
    origin: "http://localhost:3000", 
    credentials: true, 
}));

// Create 'uploads' folder if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files in 'uploads' folder
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // ✅ Fix: Make sure this runs before routes

// Routes middleware
app.use("/api/users", userRoutes);
app.use("/api/products", productRoute);

// Test route
app.get("/", (req, res) => {
    res.send("Hello World!");
});

// Error middleware
app.use(errorHandler);

// Database connection
const PORT = process.env.PORT || 5000;

console.log("MONGO_URI:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("✅ Connected to MongoDB");
        app.listen(PORT, () => {
            console.log(`✅ Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
    });
