const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

// JWT secret (store securely in env vars in real apps)
const JWT_SECRET = 'your_jwt_secret_here';

// Middleware to decode JWT and set req.user if valid token provided
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      await sql.connect(dbConfig);
      const result = await sql.query`SELECT * FROM Users WHERE id = ${decoded.userId}`;
      if (result.recordset.length > 0) {
        req.user = result.recordset[0];
        console.log('JWT decoded. User authenticated:', req.user.username);
      } else {
        console.log('User not found for decoded JWT.');
      }
    } catch (err) {
      console.error('JWT verification failed:', err.message);
    }
  } else {
    console.log('No or invalid Authorization header');
  }
  next();
});

// Register user endpoint (hash password before saving)
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  try {
    await sql.connect(dbConfig);

    // Check if user exists
    const existing = await sql.query`SELECT * FROM Users WHERE username = ${username}`;
    if (existing.recordset.length > 0) {
      return res.status(409).json({ success: false, message: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user with hashed password
    await sql.query`INSERT INTO Users (username, password) VALUES (${username}, ${hashedPassword})`;

    res.json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    await sql.connect(dbConfig);
    const result = await sql.query`SELECT * FROM Users WHERE username = ${username}`;

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.recordset[0];

    if (!password || !user.password) {
      return res.status(400).json({ success: false, message: 'Password or hash missing' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Password correct - generate JWT token
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ success: true, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Sync now endpoint (runs python script)
app.post('/api/sync-now', (req, res) => {
  const scriptPath = path.join(__dirname, 'update_shopify_inventory.py');

  exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running sync script: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Sync failed', error: error.message });
    }
    if (stderr) {
      console.error(`Sync script stderr: ${stderr}`);
    }
    console.log(`Sync script output: ${stdout}`);
    res.json({ success: true, message: 'Sync completed', output: stdout });
  });
});

// Endpoint to reveal Shopify token - requires JWT auth + password check
app.post('/api/shopify-token/:shopName', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const { password } = req.body;
  const user = req.user;

  try {
    if (!password || !user.password) {
      console.log('Password or user hash missing');
      return res.status(400).json({ error: 'Password or hash missing' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      console.log('Invalid password provided for user:', user.username);
      return res.status(403).json({ error: 'Invalid password' });
    }

    const shopName = req.params.shopName;
    console.log(`Fetching Shopify token for shop: ${shopName}`);

    const token = await getShopifyTokenFromDB(shopName);

    if (!token) {
      console.log(`No token found for shop: ${shopName}`);
      return res.status(404).json({ error: 'Shop token not found' });
    }

    res.json({ fullToken: token });
  } catch (err) {
    console.error('Error in /api/shopify-token/:shopName:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mount routers
app.use('/api/ftp-connections', ftpRoutes);
app.use('/api/shopify-settings', shopifySettingsRouter);

// Helper function: fetch Shopify token from DB
async function getShopifyTokenFromDB(shopName) {
  await sql.connect(dbConfig);
  const result = await sql.query`SELECT access_token FROM ShopifySettings WHERE shop_name = ${shopName}`;
  if (result.recordset.length > 0) {
    return result.recordset[0].access_token;
  }
  return null;
}

// Get shop data for logged in user
app.get('/api/get-shop-data', async (req, res) => {
  console.log('GET /api/get-shop-data called. req.user:', req.user);
  try {
    await sql.connect(dbConfig);

    const userId = req.user?.id;
    if (!userId) {
      console.log('Unauthorized: no userId');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await sql.query`SELECT shop_name, access_token FROM ShopifySettings WHERE user_id = ${userId}`;

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Shop data not found' });
    }

    const fullToken = result.recordset[0].access_token;
    const maskedToken = fullToken.slice(0, 6) + '...' + fullToken.slice(-4);

    res.json({
      shopName: result.recordset[0].shop_name,
      maskedToken,
    });
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
