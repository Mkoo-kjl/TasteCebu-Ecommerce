

const mysql = require("mysql2");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "tastecebu"
});

// ✅ Test connection
db.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Database connection failed:", err.message);
    } else {
        console.log("✅ Database connected successfully!");
        connection.release();
    }
});

module.exports = db.promise();