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

    // Helper to run a SQL file, filtering out CREATE/USE DATABASE lines
    const runSQLFile = async (filename) => {
      const filePath = path.join(__dirname, filename);
      if (!fs.existsSync(filePath)) {
        console.log(`  Skipping ${filename} (not found)`);
        return;
      }
      const sql = fs.readFileSync(filePath, 'utf8');
      const filtered = sql
        .split('\n')
        .filter(line => !line.match(/^(CREATE DATABASE|USE )/i))
        .join('\n');
      await connection.query(filtered);
      console.log(`  Executed ${filename}`);
    };

    // Run base schema + all migrations
    await runSQLFile('schema.sql');
    await runSQLFile('schema_update.sql');
    await runSQLFile('schema_update_v2.sql');
    await runSQLFile('schema_update_v3.sql');
    console.log('Schema and migrations applied successfully.');

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
