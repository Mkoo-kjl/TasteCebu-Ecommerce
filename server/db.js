const mysql = require('mysql2');
require('dotenv').config();

// Create the connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',      // Your HeidiSQL username
  password: '',      // Your HeidiSQL password
  database: 'tastecebu', // The name of your DB in HeidiSQL
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Export the promise-based version for cleaner async/await code
module.exports = pool.promise();