require('dotenv').config();

const bodyParser = require('body-parser');
const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require('./routes/userRoutes');
const productRoute = require('./routes/productRoute');
const orderRoute = require('./routes/orderRoute');
const reportsRoute = require('./routes/reportsRoute');
const userSettingsRoutes = require('./routes/userSettingsRoutes');
const errorHandler = require('./middleware/errorMiddleware');
const cookieParser = require('cookie-parser');
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

// Enable CORS
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"], // Frontend URLs
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["set-cookie"]
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
app.use("/api/orders", orderRoute);
app.use("/api/reports", reportsRoute);
app.use("/api/settings", userSettingsRoutes);

// Test route
app.get("/", (req, res) => {
    res.send("Hello World!");
});

// Error middleware
app.use(errorHandler);

// Database connection
const PORT = process.env.PORT || 5000; // Using port 5000 as expected by frontend

console.log("MONGO_URI:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Connected to MongoDB");
        app.listen(PORT, () => {
            console.log(`✅ Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
    });
