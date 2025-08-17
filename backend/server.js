const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const cors = require('cors')
const sql = require('mssql')
const path = require('path')
const { exec } = require('child_process')
const multer = require('multer')
const fs = require('fs')

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

// Register route
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' })
  }
  try {
    await sql.connect(sqlConfig)
    // Check if username or email already exists
    const existing = await sql.query`SELECT * FROM users WHERE username = ${username} OR email = ${email}`
    if (existing.recordset.length > 0) {
      return res.json({ success: false, message: 'Username or email already exists' })
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    await sql.query`
      INSERT INTO users (username, email, password)
      VALUES (${username}, ${email}, ${hashedPassword})
    `
    res.json({ success: true })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Mount FTP connections router with authentication
const ftpConnectionsRouter = require('./api/ftpConnections')
app.use('/api/ftp-connections', authenticateToken, ftpConnectionsRouter)

// Get shop data route
app.get('/api/get-shop-data', authenticateToken, async (req, res) => {
  try {
    await sql.connect(sqlConfig)
    const userId = req.user.userId
    const result = await sql.query`SELECT shop_name, access_token FROM ShopifySettings WHERE user_id = ${userId}`
    const shop = result.recordset[0]
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' })
    }
    // Mask the token (show first 4 and last 4 chars)
    const token = shop.access_token || ''
    const maskedToken = token.length > 8
      ? token.slice(0, 4) + '*'.repeat(token.length - 8) + token.slice(-4)
      : '*'.repeat(token.length)
    res.json({
      shopName: shop.shop_name,
      maskedToken: maskedToken,
    })
  } catch (error) {
    console.error('Error fetching shop data:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Reveal full Shopify token route
app.post('/api/shopify-token/:shopName', authenticateToken, async (req, res) => {
  const { password } = req.body
  const userId = req.user.userId
  const shopName = req.params.shopName

  if (!password) {
    return res.status(400).json({ error: 'Password required' })
  }

  try {
    await sql.connect(sqlConfig)
    // Get user password hash
    const userResult = await sql.query`SELECT password FROM users WHERE id = ${userId}`
    const user = userResult.recordset[0]
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }
    const passwordMatches = await bcrypt.compare(password, user.password)
    if (!passwordMatches) {
      return res.status(403).json({ error: 'Incorrect password' })
    }
    // Get full token
    const shopResult = await sql.query`SELECT access_token FROM ShopifySettings WHERE user_id = ${userId} AND shop_name = ${shopName}`
    const shop = shopResult.recordset[0]
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' })
    }
    res.json({ fullToken: shop.access_token })
  } catch (error) {
    console.error('Error revealing token:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get Shopify settings route
app.get('/api/shopify-settings', authenticateToken, async (req, res) => {
  try {
    await sql.connect(sqlConfig)
    const userId = req.user.userId
    const result = await sql.query`SELECT id, shop_name, access_token FROM ShopifySettings WHERE user_id = ${userId}`
    res.json(result.recordset)
  } catch (error) {
    console.error('Error fetching Shopify settings:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Add Shopify settings route
app.post('/api/shopify-settings', authenticateToken, async (req, res) => {
  const { shop_name, access_token } = req.body
  const userId = req.user.userId
  if (!shop_name || !access_token) {
    return res.status(400).json({ message: 'Shop name and access token required' })
  }
  try {
    await sql.connect(sqlConfig)
    await sql.query`
      INSERT INTO ShopifySettings (user_id, shop_name, access_token, created_at, updated_at)
      VALUES (${userId}, ${shop_name}, ${access_token}, GETDATE(), GETDATE())
    `
    res.json({ success: true })
  } catch (error) {
    console.error('Error adding Shopify setting:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Sync now route
app.post('/api/sync-now', authenticateToken, async (req, res) => {
  try {
    await sql.connect(sqlConfig)
    const userId = req.user.userId
    // Get latest uploaded file for this user
    const result = await sql.query`
      SELECT TOP 1 file_path FROM ImportedFiles WHERE user_id = ${userId} ORDER BY uploaded_at DESC
    `
    const filePath = result.recordset[0]?.file_path

    console.log('Syncing with file:', filePath);

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Uploaded file not found.' });
    }

    const scriptPath = path.join(__dirname, 'update_shopify_inventory.py')
    const env = { ...process.env, CSV_PATH: filePath }

    exec(`python "${scriptPath}"`, { env }, (error, stdout, stderr) => {
      if (error) {
        console.error('Python script error:', error, stderr);
        return res.status(500).json({ success: false, message: 'Sync failed', error: error.message, stderr })
      }
      res.json({ success: true, message: 'Sync completed', output: stdout })
    })
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message })
  }
})

// File upload route
const upload = multer({ dest: 'C:/xampp/htdocs/FTPShopify/ShopifyTech/backend/uploads/' })
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  const userId = req.user.userId
  const file = req.file

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' })
  }

  // TODO: Process the uploaded file (e.g., parse CSV, update database, etc.)

  res.json({ success: true, message: 'File uploaded successfully', filePath: file.path })
})

// CSV Import route
app.post('/api/import-csv', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.userId
    const filePath = req.file?.path

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No user ID' })
    }
    if (!filePath) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    await sql.connect(sqlConfig)
    await sql.query`
      INSERT INTO ImportedFiles (user_id, file_path, uploaded_at)
      VALUES (${userId}, ${filePath}, GETDATE())
    `

    res.json({ success: true, message: 'File imported and recorded', filePath })
  } catch (error) {
    console.error('Import failed:', error)
    res.status(500).json({ success: false, message: 'Import failed', error: error.message })
  }
})

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
