const express = require("express");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.get("/", (req, res) => {
    res.json({ message: "Backend Working 🚀" });
});

app.use("/api/auth", require("./routes/authRoutes"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server Running on port ${PORT}`);
});