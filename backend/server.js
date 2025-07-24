const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const dbConfig = {
  user: 'admin',
  password: '1234',
  server: 'localhost',
  database: 'UserAuthDB',
  options: { encrypt: true, trustServerCertificate: true },
};

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    await sql.connect(dbConfig);
    const result = await sql.query`SELECT * FROM Users WHERE username = ${username} AND password = ${password}`;

    if (result.recordset.length > 0) {
      // Normally, use hashed passwords and generate JWT token here
      res.json({ success: true, token: 'dummy-token' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.listen(4000, () => console.log('Server running on port 4000'));
