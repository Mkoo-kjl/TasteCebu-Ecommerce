const express = require("express");
const cors = require("cors");
const userRoutes = require('./Routes/userRoutes');
const bcrypt = require("bcrypt");
require("dotenv").config();

const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);

// ✅ Test route
app.get("/", (req, res) => {
    res.send("API is running...");
});

// ✅ REGISTER - Automatically sets role to 'customer'
app.post("/register", async (req, res) => {
    const { first_name, last_name, email, password } = req.body;

    if (!first_name || !email || !password) {
        return res.status(400).json({ message: "Please fill in all fields" });
    }

    try {
        const [existing] = await db.query(
            "SELECT user_id FROM user WHERE email = ?",
            [email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: "Email already in use" });
        }

        const hashed = await bcrypt.hash(password, 10);

        // We explicitly pass 'customer' here so no one can register as an admin manually
        await db.query(
            "INSERT INTO user (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)",
            [first_name, last_name, email, hashed, "customer"]
        );

        res.json({ message: "User registered!" });
    } catch (err) {
        console.error("REGISTER ERROR:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// ✅ LOGIN - Fetches 'role' and sends it to React
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Please fill in all fields" });
    }

    try {
        // SELECT * ensures the 'role' column from HeidiSQL is included in the 'rows'
        const [rows] = await db.query(
            "SELECT * FROM user WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const match = await bcrypt.compare(password, rows[0].password);

        if (!match) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Remove the password before sending the user object to the frontend
        // The 'user' variable now contains user_id, first_name, email, and ROLE
        const { password: _, ...user } = rows[0];

        res.json({ 
            message: "Login successful", 
            user: user 
        });
    } catch (err) {
        console.error("LOGIN ERROR:", err.message);
        res.status(500).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));