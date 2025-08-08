const express = require('express')
const router = express.Router()
const sql = require('mssql')

const dbConfig = {
  user: 'admin',
  password: '1234',
  server: 'localhost',
  database: 'UserAuthDB',
  options: { encrypt: true, trustServerCertificate: true },
}

let pool

// Connect once and reuse the pool
sql.connect(dbConfig)
  .then((p) => {
    pool = p
    console.log('Connected to SQL Server')
  })
  .catch((err) => {
    console.error('DB Connection Failed:', err)
  })

// GET all FTP connections for a user
router.get('/', async (req, res) => {
  const userId = parseInt(req.query.userId, 10)
  if (!userId) {
    return res.status(400).json({ success: false, error: 'Invalid or missing userId' })
  }

  try {
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM FTPConnections WHERE user_id = @userId')
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST new FTP connection
router.post('/', async (req, res) => {
  console.log('POST /api/ftp-connections body:', req.body);  // <-- Add this
  const { user_id, name, host, username, password, port } = req.body

  if (!user_id || !name || !host || !username || !password || !port) {
    return res.status(400).json({ success: false, error: 'Missing required fields' })
  }

  try {
    await pool
      .request()
      .input('user_id', sql.Int, user_id)
      .input('name', sql.NVarChar(255), name)
      .input('host', sql.NVarChar(255), host)
      .input('username', sql.NVarChar(255), username)
      .input('password', sql.NVarChar(255), password)
      .input('port', sql.Int, port)
      .query(
        `INSERT INTO FTPConnections (user_id, name, host, username, password, port, created_at, updated_at)
         VALUES (@user_id, @name, @host, @username, @password, @port, GETDATE(), GETDATE())`
      )

    res.json({ success: true, message: 'FTP connection added successfully' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PUT (update FTP connection)
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  const { name, host, username, password, port } = req.body

  if (!id || !name || !host || !username || !password || !port) {
    return res.status(400).json({ success: false, error: 'Missing required fields' })
  }

  try {
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar(255), name)
      .input('host', sql.NVarChar(255), host)
      .input('username', sql.NVarChar(255), username)
      .input('password', sql.NVarChar(255), password)
      .input('port', sql.Int, port)
      .query(
        `UPDATE FTPConnections
         SET name = @name, host = @host, username = @username,
             password = @password, port = @port, updated_at = GETDATE()
         WHERE id = @id`
      )

    res.json({ success: true, message: 'FTP connection updated successfully' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE FTP connection
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10)

  if (!id) {
    return res.status(400).json({ success: false, error: 'Invalid or missing id' })
  }

  try {
    await pool.request().input('id', sql.Int, id).query('DELETE FROM FTPConnections WHERE id = @id')
    res.json({ success: true, message: 'FTP connection deleted successfully' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
