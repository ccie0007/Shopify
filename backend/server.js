// server.js
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

// SQL Server config
const sqlConfig = {
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || '1234',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'UserAuthDB',
  options: { encrypt: false, trustServerCertificate: true },
}

// JWT middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Please login first' })

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' })
    req.user = user
    next()
  })
}

// =======================
// AUTH ROUTES
// =======================

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ message: 'Username and password are required' })

  try {
    await sql.connect(sqlConfig)
    const result = await sql.query`SELECT * FROM users WHERE username = ${username}`
    const user = result.recordset[0]
    if (!user) return res.status(401).json({ message: 'Invalid username or password' })

    const passwordMatches = await bcrypt.compare(password, user.password)
    if (!passwordMatches) return res.status(401).json({ message: 'Invalid username or password' })

    const payload = { userId: user.id, username: user.username }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })

    res.json({ success: true, token })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// Register
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body
  if (!username || !email || !password) return res.status(400).json({ message: 'All fields are required' })

  try {
    await sql.connect(sqlConfig)
    const existing = await sql.query`SELECT * FROM users WHERE username = ${username} OR email = ${email}`
    if (existing.recordset.length > 0) return res.json({ success: false, message: 'Username or email already exists' })

    const hashedPassword = await bcrypt.hash(password, 10)
    await sql.query`INSERT INTO users (username, email, password) VALUES (${username}, ${email}, ${hashedPassword})`
    res.json({ success: true })
  } catch (err) {
    console.error('Registration error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// =======================
// SHOPIFY SETTINGS
// =======================

app.get('/api/shopify-settings', authenticateToken, async (req, res) => {
  try {
    await sql.connect(sqlConfig)
    const userId = req.user.userId
    const result = await sql.query`SELECT id, shop_name, access_token FROM ShopifySettings WHERE user_id = ${userId}`
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

app.post('/api/shopify-settings', authenticateToken, async (req, res) => {
  const { shop_name, access_token } = req.body
  if (!shop_name || !access_token) return res.status(400).json({ message: 'Shop name and access token required' })

  try {
    await sql.connect(sqlConfig)
    await sql.query`
      INSERT INTO ShopifySettings (user_id, shop_name, access_token, created_at, updated_at)
      VALUES (${req.user.userId}, ${shop_name}, ${access_token}, GETDATE(), GETDATE())
    `
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// Reveal full token
app.post('/api/shopify-token/:shopName', authenticateToken, async (req, res) => {
  const { password } = req.body
  if (!password) return res.status(400).json({ error: 'Password required' })

  try {
    await sql.connect(sqlConfig)
    const userResult = await sql.query`SELECT password FROM users WHERE id = ${req.user.userId}`
    const user = userResult.recordset[0]
    if (!user) return res.status(401).json({ error: 'User not found' })

    const passwordMatches = await bcrypt.compare(password, user.password)
    if (!passwordMatches) return res.status(403).json({ error: 'Incorrect password' })

    const shopResult = await sql.query`SELECT access_token FROM ShopifySettings WHERE user_id = ${req.user.userId} AND shop_name = ${req.params.shopName}`
    const shop = shopResult.recordset[0]
    if (!shop) return res.status(404).json({ error: 'Shop not found' })

    res.json({ fullToken: shop.access_token })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// =======================
// IMPORT ACTIONS
// =======================

// Get all import actions for the logged-in user
app.get('/api/import-actions', authenticateToken, async (req, res) => {
  try {
    await sql.connect(sqlConfig)
    const userId = req.user.userId
    const result = await sql.query`
      SELECT id, name, type, lastRunTime, lastRunStatus, lastRunLog, status, [rowCount], [rowLimit]
      FROM ImportActions
      WHERE user_id = ${userId}
      ORDER BY id DESC
    `
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch import actions' })
  }
})

// Add a new import action for the logged-in user
app.post('/api/import-actions', authenticateToken, async (req, res) => {
  try {
    const { name, type } = req.body
    await sql.connect(sqlConfig)
    await sql.query`
      INSERT INTO ImportActions (user_id, name, type, lastRunTime, lastRunStatus, lastRunLog, status, [rowCount], [rowLimit])
      VALUES (
        ${req.user.userId},
        ${name},
        ${type},
        GETDATE(),
        'Never',
        '',
        'pending',
        0,
        1000
      )
    `
    res.json({ message: 'Import action created' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create import action' })
  }
})

// Delete an import action by id for the logged-in user
app.delete('/api/import-actions/:id', authenticateToken, async (req, res) => {
  try {
    console.log('DELETE endpoint hit')
    await sql.connect(sqlConfig)
    const userId = req.user.userId
    const actionId = req.params.id
    console.log('User:', userId, 'Action ID:', actionId)

    const result = await sql.query`
      DELETE FROM ImportActions WHERE id = ${actionId} AND user_id = ${userId}
    `
    console.log('Rows affected:', result.rowsAffected)

    if (result.rowsAffected[0] === 0) {
      console.log('No action deleted (not found or not owned by user)')
      return res.status(404).json({ error: 'Action not found or not yours' })
    }
    res.json({ message: 'Import action deleted' })
  } catch (err) {
    console.error('Delete error:', err)
    res.status(500).json({ error: 'Failed to delete import action' })
  }
})

// =======================
// SYNC & UPLOAD
// =======================

const upload = multer({ dest: 'uploads/' })

app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
  try {
    await sql.connect(sqlConfig)
    await sql.query`
      INSERT INTO ImportedFiles (user_id, file_path, uploaded_at)
      VALUES (${req.user.userId}, ${req.file.path}, GETDATE())
    `
    res.json({ success: true, filePath: req.file.path })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to save file info' })
  }
})

app.post('/api/sync-now', authenticateToken, async (req, res) => {
  try {
    await sql.connect(sqlConfig)
    const result = await sql.query`
      SELECT TOP 1 file_path FROM ImportedFiles WHERE user_id = ${req.user.userId} ORDER BY uploaded_at DESC
    `
    const filePath = result.recordset[0]?.file_path
    if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found' })

    const scriptPath = path.join(__dirname, 'update_shopify_inventory.py')
    exec(`python "${scriptPath}"`, { env: { ...process.env, CSV_PATH: filePath } }, (err, stdout, stderr) => {
      if (err) return res.status(500).json({ success: false, message: 'Sync failed', error: err.message, stderr })
      res.json({ success: true, message: 'Sync completed', output: stdout })
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error', error: err.message })
  }
})

// =======================
// IMPORT CSV
// =======================

app.post('/api/import-csv', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    await sql.connect(sqlConfig)
    await sql.query`
      INSERT INTO ImportedFiles (user_id, file_path, uploaded_at)
      VALUES (${req.user.userId}, ${req.file.path}, GETDATE())
    `
    // Optionally: parse/process CSV here

    res.json({ message: 'CSV imported successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'CSV import failed' })
  }
})

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
