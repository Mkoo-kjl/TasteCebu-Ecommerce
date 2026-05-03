const db = require('./db');
async function run() {
  try {
    const [[{ total_users }]] = await db.query('SELECT COUNT(*) as total_users FROM users');
    const [[{ total_sellers }]] = await db.query('SELECT COUNT(*) as total_sellers FROM users WHERE role = ?', ['seller']);
    const [[{ total_shops }]] = await db.query('SELECT COUNT(*) as total_shops FROM seller_applications WHERE status = ?', ['approved']);

    const [[{ total_revenue }]] = await db.query("SELECT SUM(total_amount) as total_revenue FROM orders WHERE status != 'cancelled'");
    const [[{ total_orders }]] = await db.query('SELECT COUNT(*) as total_orders FROM orders');
    
    const [revenue_by_date] = await db.query(`
      SELECT DATE(created_at) as date, SUM(total_amount) as revenue, COUNT(id) as orders 
      FROM orders 
      WHERE status != 'cancelled' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at) 
      ORDER BY date ASC
    `);

    const [orders_by_status] = await db.query('SELECT status, COUNT(*) as count FROM orders GROUP BY status');
    const [subscriptions_by_plan] = await db.query('SELECT subscription_plan, COUNT(*) as count FROM seller_applications WHERE status = "approved" GROUP BY subscription_plan');
    const [products_by_category] = await db.query('SELECT category, COUNT(*) as count FROM products GROUP BY category');
    const [[{ total_products }]] = await db.query('SELECT COUNT(*) as total_products FROM products');

    console.log(JSON.stringify({ 
      total_users, 
      total_sellers, 
      total_shops,
      total_revenue: total_revenue || 0,
      total_orders,
      revenue_by_date,
      orders_by_status,
      subscriptions_by_plan,
      products_by_category,
      total_products
    }, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}
run();
