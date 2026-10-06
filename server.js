const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });

const sequelize = require("./config/db");
const User = require("./models/User");
const Expense = require("./models/Expense");
const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const passwordRoutes = require("./routes/passwordRoutes");

const app = express();

// CORS
app.use(cors());

// Request logger
app.use((req, res, next) => {
    console.log("REQUEST:", req.method, req.url);
    next();
});

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/password", passwordRoutes);

// Test route
app.get("/", (req, res) => {
    res.send("Backend is running");
});

const PORT = process.env.PORT || 5000;

// Database connection and server start
sequelize
    .sync()
    .then(() => {
        console.log("Database and table connected");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Database connection failed:", error);
    });