const express = require('express');
const cors = require('cors');
const db = require('./db'); // Import the pool we just created
const app = express();

app.use(cors());
app.use(express.json());

// Example: Get all items from a 'products' table
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));