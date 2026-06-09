const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ==================== TEST ====================
router.get('/test', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 as test');
    res.json({ success: true, message: 'Database OK', data: rows });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ==================== KEGIATAN ====================
router.get('/kegiatan', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;
    
    const [rows] = await db.query(
      'SELECT * FROM kegiatan ORDER BY tglDibuat DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM kegiatan');
    
    const data = rows.map(row => {
      let gambar = [];
      try {
        gambar = typeof row.gambar === 'string' ? JSON.parse(row.gambar) : (row.gambar || []);
      } catch(e) {
        gambar = [];
      }
      return { ...row, gambar };
    });
    
    res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/kegiatan/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM kegiatan WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
    }
    let gambar = [];
    try {
      gambar = typeof rows[0].gambar === 'string' ? JSON.parse(rows[0].gambar) : (rows[0].gambar || []);
    } catch(e) {
      gambar = [];
    }
    res.json({ success: true, data: { ...rows[0], gambar } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== GALERI ====================
router.get('/galeri', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM galeri ORDER BY tglDibuat DESC');
    const data = rows.map(row => {
      let foto = [];
      try {
        foto = typeof row.foto === 'string' ? JSON.parse(row.foto) : (row.foto || []);
      } catch(e) {
        foto = [];
      }
      return { ...row, foto };
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error /galeri:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== DOKUMEN ====================
router.get('/dokumen', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM dokumen ORDER BY tglDibuat DESC');
    const data = rows.map(row => {
      let file = [];
      try {
        file = typeof row.file === 'string' ? JSON.parse(row.file) : (row.file || []);
      } catch(e) {
        file = [];
      }
      return { ...row, file };
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error /dokumen:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== ASPIRASI ====================
router.post('/aspirasi', async (req, res) => {
  try {
    const { nama, email, judul, isi } = req.body;
    if (!nama || !email || !judul || !isi) {
      return res.status(400).json({ success: false, message: 'Semua field harus diisi' });
    }
    const id = Date.now().toString();
    await db.query(
      'INSERT INTO aspirasi (id, nama, email, judul, isi) VALUES (?, ?, ?, ?, ?)',
      [id, nama, email, judul, isi]
    );
    res.json({ success: true, message: 'Aspirasi berhasil dikirim' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== HOME ====================
router.get('/home', async (req, res) => {
  try {
    const [kegiatan] = await db.query('SELECT * FROM kegiatan ORDER BY tglDibuat DESC LIMIT 3');
    const [[{ totalKegiatan }]] = await db.query('SELECT COUNT(*) as totalKegiatan FROM kegiatan');
    const [[{ totalGaleri }]] = await db.query('SELECT COUNT(*) as totalGaleri FROM galeri');
    const [[{ totalDokumen }]] = await db.query('SELECT COUNT(*) as totalDokumen FROM dokumen');
    const [[{ totalAspirasi }]] = await db.query('SELECT COUNT(*) as totalAspirasi FROM aspirasi');
    
    const kegiatanTerbaru = kegiatan.map(k => {
      let gambar = [];
      try {
        gambar = typeof k.gambar === 'string' ? JSON.parse(k.gambar) : (k.gambar || []);
      } catch(e) {
        gambar = [];
      }
      return { ...k, gambar };
    });
    
    res.json({
      success: true,
      data: {
        kegiatanTerbaru,
        totalKegiatan,
        totalGaleri,
        totalDokumen,
        totalAspirasi
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;