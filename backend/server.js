const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const cors = require('cors')
const sql = require('mssql')

const app = express()
app.use(express.json())
app.use(cors())

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here'

// SQL Server config (use env vars or defaults)
const sqlConfig = {
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || '1234',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'UserAuthDB',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
}

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: 'Please login first' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' })
  }

  try {
    await sql.connect(sqlConfig)

    const result = await sql.query`SELECT * FROM users WHERE username = ${username}`
    console.log('Login query result:', result.recordset)

    const user = result.recordset[0]

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    const passwordMatches = await bcrypt.compare(password, user.password)
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    console.log("✅ Found user:", user)
    const payload = { userId: user.id, username: user.username }
    console.log("🔑 Signing token with payload:", payload)

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })
    console.log("📦 Generated token:", token)

    res.json({ success: true, token })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Mount FTP connections router with authentication
const ftpConnectionsRouter = require('./api/ftpConnections')
app.use('/api/ftp-connections', authenticateToken, ftpConnectionsRouter)

// Get shop data route
app.get('/api/get-shop-data', authenticateToken, async (req, res) => {
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
})

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
