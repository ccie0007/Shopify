const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const bcrypt = require('bcrypt');

const shopifySettingsRouter = require('./api/shopifySettings');
const ftpRoutes = require('./api/ftpConnections');

const app = express();

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// DB config
const dbConfig = {
  user: 'admin',
  password: '1234',
  server: 'localhost',
  database: 'UserAuthDB',
  options: { encrypt: true, trustServerCertificate: true },
};

// Public: Get shop name + masked token
app.get('/api/get-shop-data', async (req, res) => {
  try {
    await sql.connect(dbConfig);
    const result = await sql.query`
      SELECT TOP 1 shop_name, access_token FROM ShopifySettings
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'No shop data found' });
    }

    const shop = result.recordset[0];
    const token = shop.access_token || '';
    const maskedToken =
      token.length > 7
        ? token.slice(0, 4) + '*'.repeat(token.length - 8) + token.slice(-4)
        : token;

    res.json({
      shopName: shop.shop_name,
      maskedToken,
    });
  } catch (err) {
    console.error('Error fetching shop data:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reveal full Shopify token — password required
app.post('/api/shopify-token/:shopName', async (req, res) => {
  const { password } = req.body;
  const shopName = req.params.shopName;

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  try {
    await sql.connect(dbConfig);

    // For demo — use first admin user for password check
    const userResult = await sql.query`SELECT TOP 1 * FROM Users`;
    if (userResult.recordset.length === 0) {
      return res.status(500).json({ error: 'No admin user found' });
    }

    const adminUser = userResult.recordset[0];
    const passwordMatches = await bcrypt.compare(password, adminUser.password);
    if (!passwordMatches) {
      return res.status(403).json({ error: 'Invalid password' });
    }

    const tokenResult = await sql.query`
      SELECT access_token FROM ShopifySettings WHERE shop_name = ${shopName}
    `;
    if (tokenResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Shop token not found' });
    }

    res.json({ fullToken: tokenResult.recordset[0].access_token });
  } catch (err) {
    console.error('Shopify token reveal error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Sync now endpoint (runs Python script)
app.post('/api/sync-now', (req, res) => {
  const scriptPath = path.join(__dirname, 'update_shopify_inventory.py');

  exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running sync script: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Sync failed' });
    }
    if (stderr) console.error(`Sync script stderr: ${stderr}`);
    console.log(`Sync script output: ${stdout}`);
    res.json({ success: true, message: 'Sync completed', output: stdout });
  });
});

// Mount routers
app.use('/api/ftp-connections', ftpRoutes);
app.use('/api/shopify-settings', shopifySettingsRouter);

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
