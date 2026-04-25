const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function seed() {
  let connection;
  try {
    // Connect without database first to create it
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      multipleStatements: true,
    });

    console.log('Connected to MySQL server.');

    // Drop and recreate database
    await connection.query('DROP DATABASE IF EXISTS tastecebu');
    await connection.query('CREATE DATABASE tastecebu');
    await connection.query('USE tastecebu');
    console.log('Database recreated.');

    // Read and execute schema (skip the CREATE/USE DATABASE lines)
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    // Filter out CREATE DATABASE and USE lines since we already handled them
    const filteredSchema = schema
      .split('\n')
      .filter(line => !line.match(/^(CREATE DATABASE|USE )/i))
      .join('\n');
    await connection.query(filteredSchema);
    console.log('Schema created successfully.');

    // Check if admin already exists
    const [existingAdmin] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      ['admin@tastecebu.com']
    );

    if (existingAdmin.length === 0) {
      // Create default admin account
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);
      const securityAnswer = await bcrypt.hash('cebu', salt);

      await connection.query(
        `INSERT INTO users (name, email, password_hash, phone, security_question, security_answer, role)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          'Admin',
          'admin@tastecebu.com',
          passwordHash,
          '09171234567',
          'What is the name of your favorite city?',
          securityAnswer,
          'admin',
        ]
      );

      // Create settings for admin
      const [adminUser] = await connection.query(
        'SELECT id FROM users WHERE email = ?',
        ['admin@tastecebu.com']
      );
      await connection.query(
        'INSERT INTO user_settings (user_id, theme, notifications_enabled) VALUES (?, ?, ?)',
        [adminUser[0].id, 'light', 1]
      );

      console.log('Default admin account created:');
      console.log('  Email: admin@tastecebu.com');
      console.log('  Password: admin123');
    } else {
      console.log('Admin account already exists, skipping.');
    }

    console.log('\nSeed completed successfully!');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

seed();
