const express = require('express');
const router = express.Router();
const sql = require('mssql');

const dbConfig = {
  user: 'admin',
  password: '1234',
  server: 'localhost',
  database: 'UserAuthDB',
  options: { encrypt: true, trustServerCertificate: true },
};

// Get all Shopify settings for a user
router.get('/', async (req, res) => {
  const userId = req.query.userId;
  console.log('GET /api/shopify-settings userId:', userId);

  try {
    await sql.connect(dbConfig);
    const result = await sql.query`
      SELECT * FROM ShopifySettings WHERE user_id = ${userId}
    `;
    console.log('SQL query result:', result.recordset);
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add or update Shopify settings
router.post('/', async (req, res) => {
  const { user_id, shop_name, access_token } = req.body;

  try {
    await sql.connect(dbConfig);

    // Upsert using MERGE for SQL Server
    await sql.query`
      MERGE ShopifySettings AS target
      USING (SELECT ${user_id} AS user_id, ${shop_name} AS shop_name, ${access_token} AS access_token) AS source
      ON target.user_id = source.user_id
      WHEN MATCHED THEN
        UPDATE SET shop_name = source.shop_name,
                   access_token = source.access_token,
                   updated_at = GETDATE()
      WHEN NOT MATCHED THEN
        INSERT (user_id, shop_name, access_token, created_at, updated_at)
        VALUES (source.user_id, source.shop_name, source.access_token, GETDATE(), GETDATE());
    `;

    res.json({ success: true });
  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Shopify settings by id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { shop_name, access_token } = req.body;

  try {
    await sql.connect(dbConfig);
    await sql.query`
      UPDATE ShopifySettings
      SET shop_name = ${shop_name},
          access_token = ${access_token},
          updated_at = GETDATE()
      WHERE user_id = ${id}
    `;
    res.json({ success: true });
  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Shopify settings by id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await sql.connect(dbConfig);
    await sql.query`
      DELETE FROM ShopifySettings WHERE user_id = ${id}
    `;
    res.json({ success: true });
  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
