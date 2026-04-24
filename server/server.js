const express = require('express');
const db = require('./db'); // Import the DB pool
const app = express();

app.get('/test-db', async (req, res) => {
  try {
    // A simple query to check the connection
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({ message: "Database connected!", result: rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database connection failed.");
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));