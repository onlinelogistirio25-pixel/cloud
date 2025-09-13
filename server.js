require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { openDb, initDb } = require('./db');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const SECRET = process.env.JWT_SECRET || 'dev-secret';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, 'public')));

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const id = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, id + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Public endpoints
app.post('/api/login', async (req, res) => {
  const { clientCode, password } = req.body;
  try {
    const db = await openDb();
    const row = await db.get('SELECT * FROM clients WHERE code = ?', clientCode);
    if (!row) return res.status(401).json({ message: 'Invalid credentials' });
    const bcrypt = require('bcrypt');
    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ clientId: row.id, code: row.code, name: row.name }, SECRET, { expiresIn: '8h' });
    res.json({ token, name: row.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Auth middleware
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const data = jwt.verify(token, SECRET);
    req.client = data;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Upload
app.post('/api/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    const db = await openDb();
    const id = uuidv4();
    await db.run(
      'INSERT INTO files (id, client_id, original_name, storage_name, size, mime, upload_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      id, req.client.clientId, req.file.originalname, req.file.filename, req.file.size, req.file.mimetype, Date.now()
    );
    res.json({ message: 'Uploaded', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload error' });
  }
});

// List files
app.get('/api/files', auth, async (req, res) => {
  try {
    const db = await openDb();
    const rows = await db.all('SELECT id, original_name, size, mime, upload_date FROM files WHERE client_id = ? ORDER BY upload_date DESC', req.client.clientId);
    res.json(rows.map(r => ({ ...r, upload_date: new Date(r.upload_date).toISOString() })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download
app.get('/api/files/:id/download', auth, async (req, res) => {
  try {
    const db = await openDb();
    const row = await db.get('SELECT * FROM files WHERE id = ? AND client_id = ?', req.params.id, req.client.clientId);
    if (!row) return res.status(404).json({ message: 'Not found' });
    const filePath = path.join(UPLOAD_DIR, row.storage_name);
    res.download(filePath, row.original_name);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete
app.delete('/api/files/:id', auth, async (req, res) => {
  try {
    const db = await openDb();
    const row = await db.get('SELECT * FROM files WHERE id = ? AND client_id = ?', req.params.id, req.client.clientId);
    if (!row) return res.status(404).json({ message: 'Not found' });
    const filePath = path.join(UPLOAD_DIR, row.storage_name);
    await db.run('DELETE FROM files WHERE id = ?', req.params.id);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Share (generate temporary link)
app.get('/api/files/:id/share', auth, async (req, res) => {
  try {
    const db = await openDb();
    const row = await db.get('SELECT * FROM files WHERE id = ? AND client_id = ?', req.params.id, req.client.clientId);
    if (!row) return res.status(404).json({ message: 'Not found' });
    const token = jwt.sign({ fileId: row.id }, SECRET, { expiresIn: '1h' });
    const url = `${req.protocol}://${req.get('host')}/api/shared/${token}`;
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Access shared
app.get('/api/shared/:token', async (req, res) => {
  try {
    const payload = jwt.verify(req.params.token, SECRET);
    const db = await openDb();
    const row = await db.get('SELECT * FROM files WHERE id = ?', payload.fileId);
    if (!row) return res.status(404).send('Not found');
    const filePath = path.join(UPLOAD_DIR, row.storage_name);
    res.download(filePath, row.original_name);
  } catch (err) {
    res.status(404).send('Link expired or invalid');
  }
});

// Init DB endpoint (dev only)
app.post('/api/init', async (req, res) => {
  try {
    await initDb();
    res.json({ message: 'DB initialized' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Init error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
