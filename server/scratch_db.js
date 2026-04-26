const db = require('./db');

async function run() {
  try {
    await db.query("ALTER TABLE seller_applications ADD COLUMN subscription_plan ENUM('basic', 'pro', 'enterprise') DEFAULT 'basic'");
    console.log("Success");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') console.log("Already exists");
    else console.error(err);
  }
  process.exit(0);
}

run();
