const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Middleware auth
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: 'Token tidak valid' });
  }
};

// Konfigurasi multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let type = 'kegiatan';
    if (req.body.type === 'galeri') type = 'galeri';
    if (req.body.type === 'dokumen') type = 'dokumen';
    const dir = path.join(__dirname, `../uploads/${type}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password]);
    if (rows.length > 0) {
      const user = rows[0];
      const token = jwt.sign({ username: user.username, role: user.role, id: user.id }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ success: true, token, role: user.role, message: 'Login berhasil' });
    }
    res.status(401).json({ success: false, message: 'Username atau password salah' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== KEGIATAN ====================
router.post('/kegiatan', verifyToken, upload.array('gambar', 5), async (req, res) => {
  try {
    const { judul, deskripsi, tanggal, lokasi } = req.body;
    const id = Date.now().toString();
    const gambar = req.files ? JSON.stringify(req.files.map(f => `/uploads/kegiatan/${f.filename}`)) : '[]';
    await db.query('INSERT INTO kegiatan (id, judul, deskripsi, tanggal, lokasi, gambar) VALUES (?, ?, ?, ?, ?, ?)', [id, judul, deskripsi, tanggal, lokasi, gambar]);
    res.json({ success: true, message: 'Kegiatan berhasil ditambahkan', id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/kegiatan', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM kegiatan ORDER BY tglDibuat DESC');
    const data = rows.map(row => {
      let gambar = [];
      try {
        gambar = typeof row.gambar === 'string' ? JSON.parse(row.gambar) : (row.gambar || []);
      } catch(e) {
        gambar = [];
      }
      return { ...row, gambar };
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error /kegiatan:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/kegiatan/:id', verifyToken, upload.array('gambar', 5), async (req, res) => {
  try {
    const { judul, deskripsi, tanggal, lokasi } = req.body;
    const id = req.params.id;
    if (req.files && req.files.length > 0) {
      const gambar = JSON.stringify(req.files.map(f => `/uploads/kegiatan/${f.filename}`));
      await db.query('UPDATE kegiatan SET judul = ?, deskripsi = ?, tanggal = ?, lokasi = ?, gambar = ? WHERE id = ?', [judul, deskripsi, tanggal, lokasi, gambar, id]);
    } else {
      await db.query('UPDATE kegiatan SET judul = ?, deskripsi = ?, tanggal = ?, lokasi = ? WHERE id = ?', [judul, deskripsi, tanggal, lokasi, id]);
    }
    res.json({ success: true, message: 'Kegiatan berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/kegiatan/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM kegiatan WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Kegiatan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== GALERI ====================
router.post('/galeri', verifyToken, upload.array('foto', 10), async (req, res) => {
  try {
    const { deskripsi, kegiatan } = req.body;
    const id = Date.now().toString();
    const foto = req.files ? JSON.stringify(req.files.map(f => `/uploads/galeri/${f.filename}`)) : '[]';
    await db.query('INSERT INTO galeri (id, deskripsi, kegiatan, foto) VALUES (?, ?, ?, ?)', [id, deskripsi, kegiatan || 'Umum', foto]);
    res.json({ success: true, message: 'Galeri berhasil ditambahkan', id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/galeri', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM galeri ORDER BY tglDibuat DESC');
    const data = rows.map(row => {
      let foto = [];
      try { foto = JSON.parse(row.foto); } catch(e) { foto = []; }
      return { ...row, foto };
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/galeri/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM galeri WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Galeri berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== DOKUMEN ====================
router.post('/dokumen', verifyToken, upload.array('file', 5), async (req, res) => {
  try {
    const { judul, deskripsi } = req.body;
    const id = Date.now().toString();
    const fileData = req.files ? JSON.stringify(req.files.map(f => ({ nama: f.originalname, url: `/uploads/dokumen/${f.filename}` }))) : '[]';
    await db.query('INSERT INTO dokumen (id, judul, deskripsi, file) VALUES (?, ?, ?, ?)', [id, judul, deskripsi || '', fileData]);
    res.json({ success: true, message: 'Dokumen berhasil ditambahkan', id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/dokumen', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM dokumen ORDER BY tglDibuat DESC');
    const data = rows.map(row => {
      let file = [];
      try { file = JSON.parse(row.file); } catch(e) { file = []; }
      return { ...row, file };
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/dokumen/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM dokumen WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Dokumen berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== ASPIRASI ====================
router.get('/aspirasi', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM aspirasi ORDER BY tanggal DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/aspirasi/:id/baca', verifyToken, async (req, res) => {
  try {
    await db.query('UPDATE aspirasi SET dibaca = TRUE WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Status aspirasi diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/aspirasi/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM aspirasi WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Aspirasi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;