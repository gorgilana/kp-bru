const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// Buat folder uploads jika belum ada
const uploadDirs = ['./uploads', './uploads/kegiatan', './uploads/galeri', './uploads/dokumen'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve static files
app.use('/uploads', express.static('uploads'));

// Import Routes
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const superadminRoutes = require('./routes/superadmin');

// Use Routes
app.use('/api', apiRoutes);
app.use('/admin-api', adminRoutes);
app.use('/superadmin-api', superadminRoutes);

// Route untuk pengunjung
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route untuk admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Route untuk super admin
app.get('/superadmin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'superadmin.html'));
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Halaman tidak ditemukan' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📱 Akses website pengunjung: http://localhost:${PORT}`);
  console.log(`🔐 Akses admin: http://localhost:${PORT}/admin`);
  console.log(`👑 Akses super admin: http://localhost:${PORT}/superadmin`);
});
