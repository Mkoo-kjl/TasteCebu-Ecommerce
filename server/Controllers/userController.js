const User = require('../Models/userModel');

exports.getUserProfile = (req, res) => {
  const userId = req.params.id;
  User.findById(userId, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: "User not found" });
    
    res.json(results[0]); // Sends the {name, email, avatar} object
  });
};