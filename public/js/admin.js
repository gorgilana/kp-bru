let adminToken = localStorage.getItem('adminToken');

if (adminToken) {
    showAdminDashboard();
} else {
    showLoginForm();
}

document.getElementById('loginForm').addEventListener('submit', handleLogin);

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('http://localhost:3000/admin-api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // CEK ROLE: jika superadmin, tolak dan beri tahu
            if (data.role === 'superadmin') {
                alert('Akses ditolak. Silakan login melalui halaman Super Admin.');
                return;
            }
            
            adminToken = data.token;
            localStorage.setItem('adminToken', adminToken);
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
            showAdminDashboard();
        } else {
            alert('Login gagal: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat login');
    }
}

function showLoginForm() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('adminSection').style.display = 'none';
}

function showAdminDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'flex';
    setupAdminNav();
    loadDashboard();
}

function setupAdminNav() {
    document.querySelectorAll('[data-menu]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const menu = link.getAttribute('data-menu');
            showAdminPage(menu);
        });
    });
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        adminToken = null;
        showLoginForm();
    });
}

function showAdminPage(pageName) {
    document.querySelectorAll('.admin-page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageName).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-menu="${pageName}"]`).classList.add('active');
    
    if (pageName === 'kegiatan') loadKegiatan();
    if (pageName === 'galeri') loadGaleri();
    if (pageName === 'dokumen') loadDokumen();
    if (pageName === 'aspirasi') loadAspirasi();
}

async function loadDashboard() {
    try {
        const response = await fetch('http://localhost:3000/api/home');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalKegiatanStat').textContent = data.data.totalKegiatan;
            document.getElementById('totalGaleriStat').textContent = data.data.totalGaleri;
            document.getElementById('totalDokumenStat').textContent = data.data.totalDokumen;
            
            // ✅ FIX: Ambil total aspirasi dari API admin
            await loadTotalAspirasi();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// ✅ TAMBAHKAN: Function baru untuk ambil total aspirasi
async function loadTotalAspirasi() {
    try {
        const response = await fetch('http://localhost:3000/admin-api/aspirasi', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalAspirasimStat').textContent = data.data.length;
            console.log(`✅ Total Aspirasi: ${data.data.length}`);
        }
    } catch (error) {
        console.error('Error loading total aspirasi:', error);
        document.getElementById('totalAspirasimStat').textContent = '0';
    }
}

// ===== KEGIATAN =====
async function loadKegiatan() {
    try {
        const response = await fetch('http://localhost:3000/admin-api/kegiatan', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await response.json();
        
        // ✅ FIX: Hapus .querySelector('tbody')
        const tbody = document.getElementById('kegiatanTable');
        tbody.innerHTML = '';
        
        if (data.success && data.data.length > 0) {
            data.data.forEach(kegiatan => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${kegiatan.judul}</td>
                    <td>${new Date(kegiatan.tanggal).toLocaleDateString('id-ID')}</td>
                    <td>${kegiatan.lokasi}</td>
                    <td>
                        <button class="btn-edit" onclick="editKegiatan('${kegiatan.id}')">Edit</button>
                        <button class="btn-delete" onclick="deleteKegiatan('${kegiatan.id}')">Hapus</button>
                    </td>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">Belum ada kegiatan</td></tr>';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading kegiatan');
    }
}




// ===== ASPIRASI =====
async function loadAspirasi() {
    try {
        const response = await fetch('http://localhost:3000/admin-api/aspirasi', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await response.json();
        
        const tbody = document.getElementById('aspirasiTable');
        tbody.innerHTML = '';
        
        if (data.success && data.data.length > 0) {
            data.data.forEach(aspirasi => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${aspirasi.nama}</td>
                    <td>${aspirasi.email}</td>
                    <td>${aspirasi.judul}</td>
                    <td><span class="status-badge ${aspirasi.dibaca ? 'dibaca' : 'belum'}">${aspirasi.dibaca ? 'Dibaca' : 'Belum dibaca'}</span></td>
                    <td>
                        <button class="btn-edit" onclick="viewAspirasi('${aspirasi.id}')">👁️ Lihat</button>
                        ${!aspirasi.dibaca ? `<button class="btn-edit" onclick="markAsRead('${aspirasi.id}')">✅ Tandai dibaca</button>` : ''}
                        <button class="btn-delete" onclick="deleteAspirasi('${aspirasi.id}')">Hapus</button>
                    </td>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">Belum ada aspirasi</td></tr>';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading aspirasi');
    }
}

// ===== ASPIRASI - VIEW DETAIL =====
async function viewAspirasi(id) {
    try {
        const response = await fetch('http://localhost:3000/admin-api/aspirasi', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await response.json();
        
        const aspirasi = data.data.find(a => a.id === id);
        
        if (!aspirasi) {
            alert('Aspirasi tidak ditemukan');
            return;
        }
        
        const modalBody = document.getElementById('modalBody');
        const tanggal = new Date(aspirasi.tanggal).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        modalBody.innerHTML = `
            <div class="aspirasi-detail">
                <h3>📋 Detail Aspirasi</h3>
                
                <div class="detail-row">
                    <label>👤 Nama:</label>
                    <p><strong>${aspirasi.nama}</strong></p>
                </div>
                
                <div class="detail-row">
                    <label>📧 Email:</label>
                    <p><a href="mailto:${aspirasi.email}">${aspirasi.email}</a></p>
                </div>
                
                <div class="detail-row">
                    <label>✍️ Judul:</label>
                    <p><strong>${aspirasi.judul}</strong></p>
                </div>
                
                <div class="detail-row">
                    <label>📅 Tanggal Dikirim:</label>
                    <p>${tanggal}</p>
                </div>
                
                <div class="detail-row">
                    <label>🔖 Status:</label>
                    <p>
                        <span class="status-badge ${aspirasi.dibaca ? 'dibaca' : 'belum'}">
                            ${aspirasi.dibaca ? '✅ Sudah Dibaca' : '❌ Belum Dibaca'}
                        </span>
                    </p>
                </div>
                
                <div class="detail-row">
    <label>💬 Isi Aspirasi:</label>
</div>
<div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 18px; padding-left: 15px; line-height: 1.8; max-height: 400px; overflow-y: auto; word-wrap: break-word; white-space: pre-wrap; border-left: 4px solid #2563eb; font-size: 14px;">
    ${aspirasi.isi.replace(/\n/g, '<br>')}
</div>
                
                <div class="modal-buttons" style="margin-top: 20px;">
                    <button type="button" class="btn-cancel" onclick="closeModal()">Tutup</button>
                    ${!aspirasi.dibaca ? `<button type="button" class="btn-submit" onclick="markAsRead('${aspirasi.id}'); closeModal(); loadAspirasi();">Tandai Sudah Dibaca</button>` : ''}
                </div>
            </div>
        `;
        
        openModal();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error membuka detail aspirasi');
    }
}

function openKegiatanForm() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h3>Tambah Kegiatan</h3>
        <form id="kegiatanForm">
            <div class="form-group">
                <label>Judul</label>
                <input type="text" id="kgJudul" required>
            </div>
            <div class="form-group">
                <label>Deskripsi</label>
                <textarea id="kgDeskripsi" required></textarea>
            </div>
            <div class="form-group">
                <label>Tanggal</label>
                <input type="date" id="kgTanggal" required>
            </div>
            <div class="form-group">
                <label>Lokasi</label>
                <input type="text" id="kgLokasi" required>
            </div>
            <div class="form-group">
                <label>Gambar (Pilih 1-5 file)</label>
                <div class="file-input-wrapper">
                    <label for="kgGambar" class="file-input-label">
                        <i class="fas fa-cloud-upload-alt"></i> Klik untuk upload gambar
                    </label>
                    <input type="file" id="kgGambar" multiple accept="image/*">
                </div>
                <!-- ✅ TAMBAHKAN: Preview gambar yang dipilih -->
                <div id="kgGambarPreview" style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;"></div>
            </div>
            <div class="modal-buttons">
                <button type="button" class="btn-cancel" onclick="closeModal()">Batal</button>
                <button type="submit" class="btn-submit">Simpan</button>
            </div>
        </form>
    `;
    
    // ✅ TAMBAHKAN: Event listener untuk preview file
    document.getElementById('kgGambar').addEventListener('change', function(e) {
        const preview = document.getElementById('kgGambarPreview');
        preview.innerHTML = '';
        
        if (this.files.length > 0) {
            Array.from(this.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.style.width = '80px';
                    img.style.height = '80px';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '5px';
                    preview.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        }
    });
    
    document.getElementById('kegiatanForm').addEventListener('submit', submitKegiatan);
    openModal();
}

async function submitKegiatan(e) {
    e.preventDefault();
    
    const judul = document.getElementById('kgJudul').value;
    const deskripsi = document.getElementById('kgDeskripsi').value;
    const tanggal = document.getElementById('kgTanggal').value;
    const lokasi = document.getElementById('kgLokasi').value;
    const files = document.getElementById('kgGambar').files;
    
    // ✅ VALIDASI: Pastikan ada file yang dipilih
    if (files.length === 0) {
        alert('❌ Pilih minimal 1 gambar!');
        return;
    }
    
    if (files.length > 5) {
        alert('❌ Maksimal 5 gambar');
        return;
    }
    
    // ✅ DEBUG: Log untuk cek apakah data tercapture
    console.log('Form Data:', {
        judul, deskripsi, tanggal, lokasi,
        fileCount: files.length,
        fileNames: Array.from(files).map(f => f.name)
    });
    
    const formData = new FormData();
    formData.append('judul', judul);
    formData.append('deskripsi', deskripsi);
    formData.append('tanggal', tanggal);
    formData.append('lokasi', lokasi);
    formData.append('type', 'kegiatan');
    
    // ✅ PENTING: Append semua file
    for (let file of files) {
        formData.append('gambar', file);
    }
    
    try {
        const response = await fetch('http://localhost:3000/admin-api/kegiatan', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` },
            body: formData
        });
        
        const data = await response.json();
        console.log('Response:', data); // ✅ DEBUG
        
        if (data.success) {
            alert('✅ Kegiatan berhasil ditambahkan');
            closeModal();
            loadKegiatan();
        } else {
            alert('❌ Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Terjadi kesalahan: ' + error.message);
    }
}

// ===== KEGIATAN - EDIT =====
async function editKegiatan(id) {
    try {
        const response = await fetch('http://localhost:3000/admin-api/kegiatan', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await response.json();
        
        // ✅ Cari kegiatan berdasarkan ID
        const kegiatan = data.data.find(k => k.id === id);
        
        if (!kegiatan) {
            alert('Kegiatan tidak ditemukan');
            return;
        }
        
        // ✅ Buka form dengan data yang sudah ada
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <h3>Edit Kegiatan</h3>
            <form id="editKegiatanForm">
                <div class="form-group">
                    <label>Judul</label>
                    <input type="text" id="ekJudul" value="${kegiatan.judul}" required>
                </div>
                <div class="form-group">
                    <label>Deskripsi</label>
                    <textarea id="ekDeskripsi" required>${kegiatan.deskripsi}</textarea>
                </div>
                <div class="form-group">
                    <label>Tanggal</label>
                    <input type="date" id="ekTanggal" value="${kegiatan.tanggal.split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Lokasi</label>
                    <input type="text" id="ekLokasi" value="${kegiatan.lokasi}" required>
                </div>
                <div class="form-group">
                    <label>Gambar (Pilih 1-5 file, atau kosongkan untuk tidak mengubah)</label>
                    <div class="file-input-wrapper">
                        <label for="ekGambar" class="file-input-label">
                            <i class="fas fa-cloud-upload-alt"></i> Klik untuk upload gambar baru
                        </label>
                        <input type="file" id="ekGambar" multiple accept="image/*">
                    </div>
                    <div id="ekGambarPreview" style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
                        <p style="font-size: 12px; color: #666;">Gambar saat ini:</p>
                        ${kegiatan.gambar.map(img => `<img src="${img}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px;">`).join('')}
                    </div>
                </div>
                <input type="hidden" id="ekId" value="${id}">
                <div class="modal-buttons">
                    <button type="button" class="btn-cancel" onclick="closeModal()">Batal</button>
                    <button type="submit" class="btn-submit">Update</button>
                </div>
            </form>
        `;
        
        // ✅ Event listener untuk preview file baru
        document.getElementById('ekGambar').addEventListener('change', function(e) {
            const preview = document.getElementById('ekGambarPreview');
            preview.innerHTML = '<p style="font-size: 12px; color: #666;">File baru yang dipilih:</p>';
            
            if (this.files.length > 0) {
                Array.from(this.files).forEach(file => {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const img = document.createElement('img');
                        img.src = event.target.result;
                        img.style.width = '80px';
                        img.style.height = '80px';
                        img.style.objectFit = 'cover';
                        img.style.borderRadius = '5px';
                        preview.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                });
            }
        });
        
        document.getElementById('editKegiatanForm').addEventListener('submit', submitEditKegiatan);
        openModal();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error membuka form edit');
    }
}

async function submitEditKegiatan(e) {
    e.preventDefault();
    
    const id = document.getElementById('ekId').value;
    const judul = document.getElementById('ekJudul').value;
    const deskripsi = document.getElementById('ekDeskripsi').value;
    const tanggal = document.getElementById('ekTanggal').value;
    const lokasi = document.getElementById('ekLokasi').value;
    const files = document.getElementById('ekGambar').files;
    
    const formData = new FormData();
    formData.append('judul', judul);
    formData.append('deskripsi', deskripsi);
    formData.append('tanggal', tanggal);
    formData.append('lokasi', lokasi);
    formData.append('type', 'kegiatan');
    
    // ✅ Tambah file baru jika ada
    for (let file of files) {
        formData.append('gambar', file);
    }
    
    try {
        const response = await fetch(`http://localhost:3000/admin-api/kegiatan/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${adminToken}` },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Kegiatan berhasil diupdate');
            closeModal();
            loadKegiatan();
        } else {
            alert('❌ Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Terjadi kesalahan: ' + error.message);
    }
}

async function deleteKegiatan(id) {
    if (confirm('Yakin ingin menghapus kegiatan ini?')) {
        try {
            const response = await fetch(`http://localhost:3000/admin-api/kegiatan/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            
            const data = await response.json();
            if (data.success) {
                alert('Kegiatan berhasil dihapus');
                loadKegiatan();
                loadDashboard();  // ✅ TAMBAHKAN INI
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan');
        }
    }
}

// ===== GALERI =====
async function loadGaleri() {
    try {
        const response = await fetch('http://localhost:3000/admin-api/galeri', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await response.json();
        const tbody = document.getElementById('galeriTable');
        tbody.innerHTML = '';
        if (data.success && data.data.length > 0) {
            data.data.forEach(galeri => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${galeri.deskripsi}</td>
                    <td>${galeri.kegiatan}</td>
                    <td><button class="btn-delete" onclick="deleteGaleri('${galeri.id}')">Hapus</button></td>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem;">Belum ada galeri</td><\/tr>';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading galeri');
    }
}


function openGaleriForm() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h3>Tambah Galeri</h3>
        <form id="galeriForm">
            <div class="form-group">
                <label>Deskripsi</label>
                <input type="text" id="glDeskripsi" required>
            </div>
            <div class="form-group">
                <label>Kegiatan</label>
                <input type="text" id="glKegiatan" placeholder="Nama kegiatan (opsional)">
            </div>
            <div class="form-group">
                <label>Foto (Pilih 1-10 file)</label>
                <div class="file-input-wrapper">
                    <label for="glFoto" class="file-input-label">
                        <i class="fas fa-cloud-upload-alt"></i> Klik untuk upload foto
                    </label>
                    <input type="file" id="glFoto" multiple accept="image/*">
                </div>
                <!-- ✅ TAMBAHKAN: Preview foto yang dipilih -->
                <div id="glFotoPreview" style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;"></div>
            </div>
            <div class="modal-buttons">
                <button type="button" class="btn-cancel" onclick="closeModal()">Batal</button>
                <button type="submit" class="btn-submit">Simpan</button>
            </div>
        </form>
    `;
    
    // ✅ TAMBAHKAN: Event listener untuk preview file
    document.getElementById('glFoto').addEventListener('change', function(e) {
        const preview = document.getElementById('glFotoPreview');
        preview.innerHTML = '';
        
        if (this.files.length > 0) {
            console.log(`✅ ${this.files.length} foto dipilih`);
            Array.from(this.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.style.width = '80px';
                    img.style.height = '80px';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '5px';
                    preview.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        }
    });
    
    document.getElementById('galeriForm').addEventListener('submit', submitGaleri);
    openModal();
}

async function submitGaleri(e) {
    e.preventDefault();
    
    const deskripsi = document.getElementById('glDeskripsi').value;
    const kegiatan = document.getElementById('glKegiatan').value;
    const files = document.getElementById('glFoto').files;
    
    // ✅ VALIDASI: Pastikan ada file yang dipilih
    if (files.length === 0) {
        alert('❌ Pilih minimal 1 foto!');
        return;
    }
    
    if (files.length > 10) {
        alert('❌ Maksimal 10 foto');
        return;
    }
    
    if (!deskripsi.trim()) {
        alert('❌ Deskripsi harus diisi');
        return;
    }
    
    // ✅ DEBUG: Log untuk cek data
    console.log('Form Data:', {
        deskripsi, kegiatan,
        fileCount: files.length,
        fileNames: Array.from(files).map(f => f.name)
    });
    
    const formData = new FormData();
    formData.append('deskripsi', deskripsi);
    formData.append('kegiatan', kegiatan || 'Umum');
    formData.append('type', 'galeri');
    
    // ✅ PENTING: Append semua file dengan nama field 'foto'
    for (let file of files) {
        formData.append('foto', file);
    }
    
    try {
        const response = await fetch('http://localhost:3000/admin-api/galeri', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` },
            body: formData
        });
        
        const data = await response.json();
        console.log('Response:', data); // ✅ DEBUG
        
        if (data.success) {
            alert('✅ Galeri berhasil ditambahkan');
            closeModal();
            loadGaleri();
        } else {
            alert('❌ Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Terjadi kesalahan: ' + error.message);
    }
}

async function deleteGaleri(id) {
    if (confirm('Yakin ingin menghapus galeri ini?')) {
        try {
            const response = await fetch(`http://localhost:3000/admin-api/galeri/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            
            const data = await response.json();
            if (data.success) {
                alert('Galeri berhasil dihapus');
                loadGaleri();
                loadDashboard();  // ✅ TAMBAHKAN INI
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan');
        }
    }
}

// ===== DOKUMEN =====
async function loadDokumen() {
    try {
        const response = await fetch('http://localhost:3000/admin-api/dokumen', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await response.json();
        const tbody = document.getElementById('dokumenTable');
        tbody.innerHTML = '';
        if (data.success && data.data.length > 0) {
            data.data.forEach(dokumen => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${dokumen.judul}</td>
                    <td>${new Date(dokumen.tglDibuat).toLocaleDateString('id-ID')}</td>
                    <td><button class="btn-delete" onclick="deleteDokumen('${dokumen.id}')">Hapus</button></td>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem;">Belum ada dokumen</td><\/tr>';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading dokumen');
    }
}

function openDokumenForm() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h3>Tambah Dokumen</h3>
        <form id="dokumenForm">
            <div class="form-group">
                <label>Judul</label>
                <input type="text" id="dkJudul" required>
            </div>
            <div class="form-group">
                <label>Deskripsi</label>
                <textarea id="dkDeskripsi" placeholder="Opsional"></textarea>
            </div>
            <div class="form-group">
                <label>File (Pilih 1-5 file)</label>
                <div class="file-input-wrapper">
                    <label for="dkFile" class="file-input-label">
                        <i class="fas fa-cloud-upload-alt"></i> Klik untuk upload file
                    </label>
                    <input type="file" id="dkFile" multiple>
                </div>
                <!-- ✅ TAMBAHKAN: Preview file yang dipilih -->
                <div id="dkFilePreview" style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 5px; max-height: 150px; overflow-y: auto;"></div>
            </div>
            <div class="modal-buttons">
                <button type="button" class="btn-cancel" onclick="closeModal()">Batal</button>
                <button type="submit" class="btn-submit">Simpan</button>
            </div>
        </form>
    `;
    
    // ✅ TAMBAHKAN: Event listener untuk preview file
    document.getElementById('dkFile').addEventListener('change', function(e) {
        const preview = document.getElementById('dkFilePreview');
        preview.innerHTML = '';
        
        if (this.files.length > 0) {
            console.log(`✅ ${this.files.length} file dipilih`);
            const fileList = document.createElement('ul');
            fileList.style.margin = '0';
            fileList.style.paddingLeft = '20px';
            
            Array.from(this.files).forEach(file => {
                const li = document.createElement('li');
                li.style.fontSize = '12px';
                li.style.padding = '5px 0';
                
                // ✅ Tampilkan icon berdasarkan tipe file
                let icon = '📄';
                if (file.type.includes('pdf')) icon = '📕';
                if (file.type.includes('sheet') || file.type.includes('excel')) icon = '📊';
                if (file.type.includes('word')) icon = '📝';
                if (file.type.includes('zip') || file.type.includes('rar')) icon = '📦';
                
                const size = (file.size / 1024).toFixed(2);
                li.textContent = `${icon} ${file.name} (${size} KB)`;
                fileList.appendChild(li);
            });
            
            preview.appendChild(fileList);
        } else {
            preview.innerHTML = '<p style="color: #999; font-size: 12px; margin: 0;">Belum ada file dipilih</p>';
        }
    });
    
    document.getElementById('dokumenForm').addEventListener('submit', submitDokumen);
    openModal();
}

async function submitDokumen(e) {
    e.preventDefault();
    
    const judul = document.getElementById('dkJudul').value;
    const deskripsi = document.getElementById('dkDeskripsi').value;
    const files = document.getElementById('dkFile').files;
    
    // ✅ VALIDASI: Pastikan ada file yang dipilih
    if (files.length === 0) {
        alert('❌ Pilih minimal 1 file!');
        return;
    }
    
    if (files.length > 5) {
        alert('❌ Maksimal 5 file');
        return;
    }
    
    if (!judul.trim()) {
        alert('❌ Judul harus diisi');
        return;
    }
    
    // ✅ VALIDASI: Cek ukuran file (max 50MB per file)
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    for (let file of files) {
        if (file.size > maxFileSize) {
            alert(`❌ File "${file.name}" terlalu besar (max 50MB)`);
            return;
        }
    }
    
    // ✅ DEBUG: Log untuk cek data
    console.log('Form Data:', {
        judul, deskripsi,
        fileCount: files.length,
        fileNames: Array.from(files).map(f => `${f.name} (${(f.size / 1024).toFixed(2)} KB)`)
    });
    
    const formData = new FormData();
    formData.append('judul', judul);
    formData.append('deskripsi', deskripsi);
    formData.append('type', 'dokumen');
    
    // ✅ PENTING: Append semua file dengan nama field 'file'
    for (let file of files) {
        formData.append('file', file);
    }
    
    try {
        const response = await fetch('http://localhost:3000/admin-api/dokumen', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` },
            body: formData
        });
        
        const data = await response.json();
        console.log('Response:', data); // ✅ DEBUG
        
        if (data.success) {
            alert('✅ Dokumen berhasil ditambahkan');
            closeModal();
            loadDokumen();
        } else {
            alert('❌ Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Terjadi kesalahan: ' + error.message);
    }
}

async function deleteDokumen(id) {
    if (confirm('Yakin ingin menghapus dokumen ini?')) {
        try {
            const response = await fetch(`http://localhost:3000/admin-api/dokumen/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            
            const data = await response.json();
            if (data.success) {
                alert('Dokumen berhasil dihapus');
                loadDokumen();
                loadDashboard();  // ✅ TAMBAHKAN INI
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan');
        }
    }
}

async function markAsRead(id) {
    try {
        const response = await fetch(`http://localhost:3000/admin-api/aspirasi/${id}/baca`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const data = await response.json();
        if (data.success) {
            loadAspirasi();
            loadDashboard();  // ✅ TAMBAHKAN INI (opsional)
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function deleteAspirasi(id) {
    if (confirm('Yakin ingin menghapus aspirasi ini?')) {
        try {
            const response = await fetch(`http://localhost:3000/admin-api/aspirasi/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            
            const data = await response.json();
            if (data.success) {
                alert('Aspirasi berhasil dihapus');
                loadAspirasi();
                loadDashboard();  // ✅ TAMBAHKAN INI
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan');
        }
    }
}

// MODAL FUNCTIONS
function openModal() {
    document.getElementById('formModal').classList.add('show');
}

function closeModal() {
    document.getElementById('formModal').classList.remove('show');
}

document.getElementById('formModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('formModal')) {
        closeModal();
    }
});