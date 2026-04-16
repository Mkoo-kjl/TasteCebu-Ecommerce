const db = require('../db'); // Assuming db.js exports your mysql connection

const User = {
  findById: (id, callback) => {
    return db.query(
      "SELECT full_name as name, email, avatar FROM users WHERE id = ?", 
      [id], 
      callback
    );
  }
};

module.exports = User;