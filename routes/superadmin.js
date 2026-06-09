const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Middleware verify superadmin
const verifySuperAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya Super Admin.' });
    }
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
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// ==================== LOGIN SUPERADMIN ====================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Superadmin login attempt:', username);
    
    const [rows] = await db.query(
      'SELECT * FROM admins WHERE username = ? AND password = ? AND role = "superadmin"',
      [username, password]
    );
    
    if (rows.length > 0) {
      const user = rows[0];
      const token = jwt.sign(
        { username: user.username, role: user.role, id: user.id },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({
        success: true,
        token: token,
        role: user.role,
        message: 'Login berhasil'
      });
    }
    
    res.status(401).json({ success: false, message: 'Username atau password salah' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error: ' + error.message });
  }
});

// ==================== KEGIATAN (dengan parsing aman) ====================
router.post('/kegiatan', verifySuperAdmin, upload.array('gambar', 5), async (req, res) => {
  try {
    const { judul, deskripsi, tanggal, lokasi } = req.body;
    const id = Date.now().toString();
    const gambar = req.files ? JSON.stringify(req.files.map(f => `/uploads/kegiatan/${f.filename}`)) : '[]';
    
    await db.query(
      'INSERT INTO kegiatan (id, judul, deskripsi, tanggal, lokasi, gambar) VALUES (?, ?, ?, ?, ?, ?)',
      [id, judul, deskripsi, tanggal, lokasi, gambar]
    );
    
    res.json({ success: true, message: 'Kegiatan berhasil ditambahkan', id: id });
  } catch (error) {
    console.error('Error adding kegiatan:', error);
    res.status(500).json({ success: false, message: 'Error: ' + error.message });
  }
});

router.get('/kegiatan', verifySuperAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM kegiatan ORDER BY tglDibuat DESC');
    const data = rows.map(row => {
      let gambar = [];
      if (row.gambar) {
        try {
          gambar = typeof row.gambar === 'string' ? JSON.parse(row.gambar) : row.gambar;
        } catch (e) {
          console.error(`Gagal parse gambar untuk kegiatan ID ${row.id}:`, e.message);
          gambar = [];
        }
      }
      return { ...row, gambar };
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error GET /kegiatan:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/kegiatan/:id', verifySuperAdmin, upload.array('gambar', 5), async (req, res) => {
  try {
    const { judul, deskripsi, tanggal, lokasi } = req.body;
    const id = req.params.id;
    
    if (req.files && req.files.length > 0) {
      const gambar = JSON.stringify(req.files.map(f => `/uploads/kegiatan/${f.filename}`));
      await db.query(
        'UPDATE kegiatan SET judul = ?, deskripsi = ?, tanggal = ?, lokasi = ?, gambar = ? WHERE id = ?',
        [judul, deskripsi, tanggal, lokasi, gambar, id]
      );
    } else {
      await db.query(
        'UPDATE kegiatan SET judul = ?, deskripsi = ?, tanggal = ?, lokasi = ? WHERE id = ?',
        [judul, deskripsi, tanggal, lokasi, id]
      );
    }
    
    res.json({ success: true, message: 'Kegiatan berhasil diupdate' });
  } catch (error) {
    console.error('Error update kegiatan:', error);
    res.status(500).json({ success: false, message: 'Error: ' + error.message });
  }
});

router.delete('/kegiatan/:id', verifySuperAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM kegiatan WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Kegiatan berhasil dihapus' });
  } catch (error) {
    console.error('Error delete kegiatan:', error);
    res.status(500).json({ success: false, message: 'Error: ' + error.message });
  }
});

// ==================== GALERI ====================
router.post('/galeri', verifySuperAdmin, upload.array('foto', 10), async (req, res) => {
  try {
    const { deskripsi, kegiatan } = req.body;
    const id = Date.now().toString();
    const foto = req.files ? JSON.stringify(req.files.map(f => `/uploads/galeri/${f.filename}`)) : '[]';
    
    await db.query(
      'INSERT INTO galeri (id, deskripsi, kegiatan, foto) VALUES (?, ?, ?, ?)',
      [id, deskripsi, kegiatan || 'Umum', foto]
    );
    
    res.json({ success: true, message: 'Galeri berhasil ditambahkan', id: id });
  } catch (error) {
    console.error('Error add galeri:', error);
    res.status(500).json({ success: false, message: 'Error: ' + error.message });
  }
});

router.get('/galeri', verifySuperAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM galeri ORDER BY tglDibuat DESC');
    const data = rows.map(row => {
      let foto = [];
      if (row.foto) {
        try {
          foto = typeof row.foto === 'string' ? JSON.parse(row.foto) : row.foto;
        } catch (e) {
          console.error(`Gagal parse foto untuk galeri ID ${row.id}:`, e.message);
          foto = [];
        }
      }
      return { ...row, foto };
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error GET /galeri:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/galeri/:id', verifySuperAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM galeri WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Galeri berhasil dihapus' });
  } catch (error) {
    console.error('Error delete galeri:', error);
    res.status(500).json({ success: false, message: 'Error: ' + error.message });
  }
});

// ==================== DOKUMEN ====================
router.post('/dokumen', verifySuperAdmin, upload.array('file', 5), async (req, res) => {
  try {
    const { judul, deskripsi } = req.body;
    const id = Date.now().toString();
    const fileData = req.files ? JSON.stringify(req.files.map(f => ({ nama: f.originalname, url: `/uploads/dokumen/${f.filename}` }))) : '[]';
    
    await db.query(
      'INSERT INTO dokumen (id, judul, deskripsi, file) VALUES (?, ?, ?, ?)',
      [id, judul, deskripsi || '', fileData]
    );
    
    res.json({ success: true, message: 'Dokumen berhasil ditambahkan', id: id });
  } catch (error) {
    console.error('Error add dokumen:', error);
    res.status(500).json({ success: false, message: 'Error: ' + error.message });
  }
});

router.get('/dokumen', verifySuperAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM dokumen ORDER BY tglDibuat DESC');
    const data = rows.map(row => {
      let file = [];
      if (row.file) {
        try {
          file = JSON.parse(row.file);
        } catch(e) {
          file = [];
        }
      }
      return { ...row, file };
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error GET dokumen:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/dokumen', verifySuperAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM dokumen ORDER BY tglDibuat DESC');
    const data = rows.map(row => {
      let file = [];
      if (row.file) {
        try {
          file = typeof row.file === 'string' ? JSON.parse(row.file) : row.file;
        } catch (e) {
          console.error(`Gagal parse file untuk dokumen ID ${row.id}:`, e.message);
          file = [];
        }
      }
      return { ...row, file };
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error GET /dokumen:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== ASPIRASI ====================
router.get('/aspirasi', verifySuperAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM aspirasi ORDER BY tanggal DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error GET aspirasi:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/aspirasi/:id/baca', verifySuperAdmin, async (req, res) => {
  try {
    await db.query('UPDATE aspirasi SET dibaca = TRUE WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Status aspirasi diupdate' });
  } catch (error) {
    console.error('Error update aspirasi:', error);
    res.status(500).json({ success: false, message: 'Error: ' + error.message });
  }
});

router.delete('/aspirasi/:id', verifySuperAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM aspirasi WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Aspirasi berhasil dihapus' });
  } catch (error) {
    console.error('Error delete aspirasi:', error);
    res.status(500).json({ success: false, message: 'Error: ' + error.message });
  }
});

// ==================== KELOLA ADMIN ====================
router.get('/admins', verifySuperAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username, role, createdAt FROM admins WHERE username != ?', [req.admin.username]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error GET admins:', error);
    res.status(500).json({ success: false, message: 'Error: ' + error.message });
  }
});

router.post('/admins', verifySuperAdmin, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password harus diisi' });
    }
    
    const [existing] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username sudah digunakan' });
    }
    
    const id = Date.now().toString();
    await db.query(
      'INSERT INTO admins (id, username, password, role) VALUES (?, ?, ?, ?)',
      [id, username, password, 'admin']
    );
    
    res.json({ success: true, message: 'Admin berhasil ditambahkan' });
  } catch (error) {
    console.error('Error add admin:', error);
    res.status(500).json({ success: false, message: 'Error: ' + error.message });
  }
});

router.delete('/admins/:id', verifySuperAdmin, async (req, res) => {
  try {
    const [admin] = await db.query('SELECT * FROM admins WHERE id = ?', [req.params.id]);
    if (admin.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin tidak ditemukan' });
    }
    if (admin[0].role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Tidak dapat menghapus Super Admin' });
    }
    
    await db.query('DELETE FROM admins WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Admin berhasil dihapus' });
  } catch (error) {
    console.error('Error delete admin:', error);
    res.status(500).json({ success: false, message: 'Error: ' + error.message });
  }
});

router.delete('/dokumen/:id', verifySuperAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM dokumen WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Dokumen berhasil dihapus' });
    } catch (error) {
        console.error('Error delete dokumen:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Stats untuk dashboard
router.get('/stats', verifySuperAdmin, async (req, res) => {
  try {
    const [[{ totalKegiatan }]] = await db.query('SELECT COUNT(*) as totalKegiatan FROM kegiatan');
    const [[{ totalGaleri }]] = await db.query('SELECT COUNT(*) as totalGaleri FROM galeri');
    const [[{ totalDokumen }]] = await db.query('SELECT COUNT(*) as totalDokumen FROM dokumen');
    const [[{ totalAspirasi }]] = await db.query('SELECT COUNT(*) as totalAspirasi FROM aspirasi');
    const [[{ totalAdmin }]] = await db.query('SELECT COUNT(*) as totalAdmin FROM admins WHERE role = "admin"');
    
    res.json({
      success: true,
      data: {
        totalKegiatan,
        totalGaleri,
        totalDokumen,
        totalAspirasi,
        totalAdmin
      }
    });
  } catch (error) {
    console.error('Error GET stats:', error);
    res.status(500).json({ success: false, message: 'Error: ' + error.message });
  }
});

module.exports = router;