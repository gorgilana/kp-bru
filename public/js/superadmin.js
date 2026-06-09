// ========== KONFIGURASI ==========
const API_BASE = 'http://localhost:3000';
let adminToken = localStorage.getItem('adminToken');
let currentUser = null;

// ========== FUNGSI BANTU ==========
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function decodeToken(token) {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch(e) { return null; }
}

// ========== LOGIN ==========
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    try {
        const res = await fetch(`${API_BASE}/superadmin-api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success && data.role === 'superadmin') {
            adminToken = data.token;
            currentUser = decodeToken(adminToken);
            localStorage.setItem('adminToken', adminToken);
            showToast('Login berhasil!');
            showAdminDashboard();
        } else {
            showToast('Login gagal: ' + data.message, 'error');
        }
    } catch (error) {
        showToast('Terjadi kesalahan', 'error');
    }
});

function showLoginForm() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('adminSection').style.display = 'none';
}

function showAdminDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'flex';
    document.getElementById('userName').textContent = currentUser?.username || 'Super Admin';
    setupNavigation();
    loadDashboard();
    loadKegiatan();
    loadGaleri();
    loadDokumen();
    loadAspirasi();
    loadAdmins();
}

function setupNavigation() {
    document.querySelectorAll('[data-menu]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const menu = link.getAttribute('data-menu');
            document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
            document.getElementById(menu).classList.add('active');
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            link.classList.add('active');
        });
    });
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        showLoginForm();
    });
}

// ========== DASHBOARD ==========
async function loadDashboard() {
    try {
        const res = await fetch(`${API_BASE}/api/home`);
        const data = await res.json();
        if (data.success) {
            document.getElementById('totalKegiatanStat').textContent = data.data.totalKegiatan;
            document.getElementById('totalGaleriStat').textContent = data.data.totalGaleri;
            document.getElementById('totalDokumenStat').textContent = data.data.totalDokumen;
            document.getElementById('totalAspirasiStat').textContent = data.data.totalAspirasi;
        }
    } catch(e) { console.error(e); }
}

// ==================== KEGIATAN (LENGKAP) ====================
async function loadKegiatan() {
    try {
        const res = await fetch(`${API_BASE}/superadmin-api/kegiatan`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
        const data = await res.json();
        const tbody = document.getElementById('kegiatanTable');
        if (data.success && data.data.length) {
            tbody.innerHTML = data.data.map(k => `
                <tr>
                    <td>${k.judul}</td>
                    <td>${new Date(k.tanggal).toLocaleDateString('id-ID')}</td>
                    <td>${k.lokasi}</td>
                    <td>
                        <button class="btn-edit" onclick="editKegiatan('${k.id}')">Edit</button>
                        <button class="btn-delete" onclick="deleteKegiatan('${k.id}')">Hapus</button>
                    </td>
                <tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4">Belum ada kegiatan<\/td><\/tr>';
        }
    } catch(e) { console.error(e); }
}

function openKegiatanForm() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h3>Tambah Kegiatan</h3>
        <form id="kegiatanForm" enctype="multipart/form-data">
            <div class="form-group"><label>Judul</label><input type="text" id="kgJudul" required></div>
            <div class="form-group"><label>Deskripsi</label><textarea id="kgDeskripsi" required></textarea></div>
            <div class="form-group"><label>Tanggal</label><input type="date" id="kgTanggal" required></div>
            <div class="form-group"><label>Lokasi</label><input type="text" id="kgLokasi" required></div>
            <div class="form-group">
                <label>Gambar (Max 5 file)</label>
                <div class="file-input-wrapper">
                    <label for="kgGambar" class="file-input-label">
                        <i class="fas fa-cloud-upload-alt"></i> Klik untuk upload gambar
                    </label>
                    <input type="file" id="kgGambar" multiple accept="image/*">
                </div>
                <div id="kgPreview" class="image-preview" style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;"></div>
            </div>
            <div class="modal-buttons"><button type="button" class="btn-cancel" onclick="closeModal()">Batal</button><button type="submit" class="btn-submit">Simpan</button></div>
        </form>
    `;
    
    const fileInput = document.getElementById('kgGambar');
    const preview = document.getElementById('kgPreview');
    
    fileInput.addEventListener('change', function(e) {
        preview.innerHTML = '';
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = document.createElement('img');
                img.src = ev.target.result;
                img.style.width = '80px';
                img.style.height = '80px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '5px';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    });
    
    document.getElementById('kegiatanForm').addEventListener('submit', submitKegiatan);
    openModal();
}

async function submitKegiatan(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('judul', document.getElementById('kgJudul').value);
    formData.append('deskripsi', document.getElementById('kgDeskripsi').value);
    formData.append('tanggal', document.getElementById('kgTanggal').value);
    formData.append('lokasi', document.getElementById('kgLokasi').value);
    formData.append('type', 'kegiatan');
    const files = document.getElementById('kgGambar').files;
    if(files.length === 0) { showToast('Pilih minimal 1 gambar!', 'error'); return; }
    for(let f of files) formData.append('gambar', f);
    try {
        const res = await fetch(`${API_BASE}/superadmin-api/kegiatan`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` },
            body: formData
        });
        const data = await res.json();
        if(data.success) { showToast('Kegiatan ditambahkan'); closeModal(); loadKegiatan(); loadDashboard(); }
        else { showToast('Gagal: ' + data.message, 'error'); }
    } catch(err) { showToast('Error: ' + err.message, 'error'); }
}

async function editKegiatan(id) {
    const res = await fetch(`${API_BASE}/superadmin-api/kegiatan`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    const data = await res.json();
    const k = data.data.find(x => x.id === id);
    if (!k) { showToast('Tidak ditemukan', 'error'); return; }

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h3>Edit Kegiatan</h3>
        <form id="editKegiatanForm" enctype="multipart/form-data">
            <div class="form-group"><label>Judul</label><input type="text" id="ekJudul" value="${k.judul.replace(/"/g, '&quot;')}" required></div>
            <div class="form-group"><label>Deskripsi</label><textarea id="ekDeskripsi" required>${k.deskripsi.replace(/</g, '&lt;')}</textarea></div>
            <div class="form-group"><label>Tanggal</label><input type="date" id="ekTanggal" value="${k.tanggal.split('T')[0]}" required></div>
            <div class="form-group"><label>Lokasi</label><input type="text" id="ekLokasi" value="${k.lokasi.replace(/"/g, '&quot;')}" required></div>
            <div class="form-group">
                <label>Gambar Baru (Opsional)</label>
                <div class="file-input-wrapper">
                    <label for="ekGambar" class="file-input-label">
                        <i class="fas fa-cloud-upload-alt"></i> Upload gambar baru
                    </label>
                    <input type="file" id="ekGambar" multiple accept="image/*">
                </div>
                <div id="ekPreview" class="image-preview" style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;"></div>
            </div>
            <div class="modal-buttons"><button type="button" class="btn-cancel" onclick="closeModal()">Batal</button><button type="submit" class="btn-submit">Update</button></div>
        </form>
    `;

    const fileInput = document.getElementById('ekGambar');
    const preview = document.getElementById('ekPreview');

    fileInput.addEventListener('change', function(e) {
        preview.innerHTML = '';
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = document.createElement('img');
                img.src = ev.target.result;
                img.style.width = '80px';
                img.style.height = '80px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '5px';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    });

    document.getElementById('editKegiatanForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('judul', document.getElementById('ekJudul').value);
        formData.append('deskripsi', document.getElementById('ekDeskripsi').value);
        formData.append('tanggal', document.getElementById('ekTanggal').value);
        formData.append('lokasi', document.getElementById('ekLokasi').value);
        formData.append('type', 'kegiatan');
        const files = document.getElementById('ekGambar').files;
        for (let f of files) formData.append('gambar', f);
        const updateRes = await fetch(`${API_BASE}/superadmin-api/kegiatan/${id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${adminToken}` }, body: formData });
        const updateData = await updateRes.json();
        if (updateData.success) { showToast('Kegiatan diupdate'); closeModal(); loadKegiatan(); }
        else { showToast('Gagal: ' + updateData.message, 'error'); }
    });
    openModal();
}

async function deleteKegiatan(id) {
    if(confirm('Hapus kegiatan ini?')) {
        await fetch(`${API_BASE}/superadmin-api/kegiatan/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` } });
        loadKegiatan(); loadDashboard();
    }
}

// ==================== GALERI (LENGKAP) ====================
async function loadGaleri() {
    try {
        const res = await fetch(`${API_BASE}/superadmin-api/galeri`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
        const data = await res.json();
        const tbody = document.getElementById('galeriTable');
        if (data.success && data.data.length) {
            tbody.innerHTML = data.data.map(g => `
                <tr>
                    <td>${g.deskripsi}</td>
                    <td>${g.kegiatan}</td>
                    <td><button class="btn-delete" onclick="deleteGaleri('${g.id}')">Hapus</button></td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="3">Belum ada galeri<\/td><\/tr>';
        }
    } catch(e) { console.error(e); }
}

function openGaleriForm() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h3>Tambah Galeri</h3>
        <form id="galeriForm" enctype="multipart/form-data">
            <div class="form-group"><label>Deskripsi</label><input type="text" id="glDeskripsi" required></div>
            <div class="form-group"><label>Kegiatan</label><input type="text" id="glKegiatan" placeholder="Nama kegiatan (opsional)"></div>
            <div class="form-group">
                <label>Foto (Max 10 file)</label>
                <div class="file-input-wrapper">
                    <label for="glFoto" class="file-input-label">
                        <i class="fas fa-cloud-upload-alt"></i> Klik untuk upload foto
                    </label>
                    <input type="file" id="glFoto" multiple accept="image/*">
                </div>
                <div id="glPreview" class="image-preview" style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;"></div>
            </div>
            <div class="modal-buttons"><button type="button" class="btn-cancel" onclick="closeModal()">Batal</button><button type="submit" class="btn-submit">Simpan</button></div>
        </form>
    `;
    
    const fileInput = document.getElementById('glFoto');
    const preview = document.getElementById('glPreview');
    
    fileInput.addEventListener('change', function(e) {
        preview.innerHTML = '';
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = document.createElement('img');
                img.src = ev.target.result;
                img.style.width = '80px';
                img.style.height = '80px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '5px';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    });
    
    document.getElementById('galeriForm').addEventListener('submit', submitGaleri);
    openModal();
}

async function submitGaleri(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('deskripsi', document.getElementById('glDeskripsi').value);
    formData.append('kegiatan', document.getElementById('glKegiatan').value || 'Umum');
    formData.append('type', 'galeri');
    const files = document.getElementById('glFoto').files;
    if(files.length === 0) { showToast('Pilih minimal 1 foto!', 'error'); return; }
    for(let f of files) formData.append('foto', f);
    try {
        const res = await fetch(`${API_BASE}/superadmin-api/galeri`, { method: 'POST', headers: { 'Authorization': `Bearer ${adminToken}` }, body: formData });
        const data = await res.json();
        if(data.success) { showToast('Galeri ditambahkan'); closeModal(); loadGaleri(); loadDashboard(); }
        else { showToast('Gagal: ' + data.message, 'error'); }
    } catch(err) { showToast('Error: ' + err.message, 'error'); }
}

async function deleteGaleri(id) {
    if(confirm('Hapus galeri ini?')) {
        await fetch(`${API_BASE}/superadmin-api/galeri/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` } });
        loadGaleri(); loadDashboard();
    }
}

// ==================== DOKUMEN (LENGKAP) ====================
async function loadDokumen() {
    try {
        const res = await fetch(`${API_BASE}/superadmin-api/dokumen`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
        const data = await res.json();
        const tbody = document.getElementById('dokumenTable');
        if (data.success && data.data.length) {
            tbody.innerHTML = data.data.map(d => `
                <tr>
                    <td>${d.judul}</td>
                    <td>${new Date(d.tglDibuat).toLocaleDateString('id-ID')}</td>
                    <td><button class="btn-delete" onclick="deleteDokumen('${d.id}')">Hapus</button></td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="3">Belum ada dokumen<\/td><\/tr>';
        }
    } catch(e) { console.error(e); }
}

function openDokumenForm() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h3>Tambah Dokumen</h3>
        <form id="dokumenForm" enctype="multipart/form-data">
            <div class="form-group"><label>Judul</label><input type="text" id="dkJudul" required></div>
            <div class="form-group"><label>Deskripsi</label><textarea id="dkDeskripsi" placeholder="Opsional"></textarea></div>
            <div class="form-group">
                <label>File (Max 5 file)</label>
                <div class="file-input-wrapper">
                    <label for="dkFile" class="file-input-label">
                        <i class="fas fa-cloud-upload-alt"></i> Klik untuk upload file
                    </label>
                    <input type="file" id="dkFile" multiple>
                </div>
                <div id="dkPreview" style="margin-top:10px; font-size:12px; color:#666;"></div>
            </div>
            <div class="modal-buttons"><button type="button" class="btn-cancel" onclick="closeModal()">Batal</button><button type="submit" class="btn-submit">Simpan</button></div>
        </form>
    `;
    
    const fileInput = document.getElementById('dkFile');
    const preview = document.getElementById('dkPreview');
    
    fileInput.addEventListener('change', function(e) {
        preview.innerHTML = `<i class="fas fa-file"></i> ${this.files.length} file dipilih`;
    });
    
    document.getElementById('dokumenForm').addEventListener('submit', submitDokumen);
    openModal();
}

async function submitDokumen(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('judul', document.getElementById('dkJudul').value);
    formData.append('deskripsi', document.getElementById('dkDeskripsi').value);
    formData.append('type', 'dokumen');
    const files = document.getElementById('dkFile').files;
    if(files.length === 0) { showToast('Pilih minimal 1 file!', 'error'); return; }
    for(let f of files) formData.append('file', f);
    try {
        const res = await fetch(`${API_BASE}/superadmin-api/dokumen`, { method: 'POST', headers: { 'Authorization': `Bearer ${adminToken}` }, body: formData });
        const data = await res.json();
        if(data.success) { showToast('Dokumen ditambahkan'); closeModal(); loadDokumen(); loadDashboard(); }
        else { showToast('Gagal: ' + data.message, 'error'); }
    } catch(err) { showToast('Error: ' + err.message, 'error'); }
}

async function deleteDokumen(id) {
    if (confirm('Yakin ingin menghapus dokumen ini?')) {
        try {
            const res = await fetch(`${API_BASE}/superadmin-api/dokumen/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            const data = await res.json();
            if (data.success) {
                showToast('Dokumen berhasil dihapus', 'success');
                loadDokumen();  // refresh tabel
                loadDashboard(); // update statistik
            } else {
                showToast('Gagal: ' + data.message, 'error');
            }
        } catch (error) {
            showToast('Terjadi kesalahan', 'error');
        }
    }
}

// ==================== ASPIRASI ====================
async function loadAspirasi() {
    try {
        const res = await fetch(`${API_BASE}/superadmin-api/aspirasi`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
        const data = await res.json();
        const tbody = document.getElementById('aspirasiTable');
        if (data.success && data.data.length) {
            tbody.innerHTML = data.data.map(a => `
                <tr>
                    <td>${a.nama}</td>
                    <td>${a.email}</td>
                    <td>${a.judul}</td>
                    <td><span class="status-badge ${a.dibaca ? 'dibaca' : 'belum'}">${a.dibaca ? 'Dibaca' : 'Belum dibaca'}</span></td>
                    <td>
                        <button class="btn-edit" onclick="viewAspirasiDetail('${a.id}')">Lihat</button>
                        ${!a.dibaca ? `<button class="btn-edit" onclick="markAsRead('${a.id}')">Tandai dibaca</button>` : ''}
                        <button class="btn-delete" onclick="deleteAspirasi('${a.id}')">Hapus</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5">Belum ada aspirasi<\/td><\/tr>';
        }
    } catch(e) { console.error(e); }
}

async function viewAspirasiDetail(id) {
    try {
        const res = await fetch(`${API_BASE}/superadmin-api/aspirasi`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
        const data = await res.json();
        const aspirasi = data.data.find(a => a.id === id);
        if (!aspirasi) {
            showToast('Aspirasi tidak ditemukan', 'error');
            return;
        }
        const modalBody = document.getElementById('modalBody');
        const tanggal = new Date(aspirasi.tanggal).toLocaleString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        modalBody.innerHTML = `
            <div class="aspirasi-detail">
                <h3><i class="fas fa-envelope-open-text"></i> Detail Aspirasi</h3>
                <div class="detail-row"><label>👤 Nama:</label><p><strong>${aspirasi.nama}</strong></p></div>
                <div class="detail-row"><label>📧 Email:</label><p><a href="mailto:${aspirasi.email}">${aspirasi.email}</a></p></div>
                <div class="detail-row"><label>✍️ Judul:</label><p><strong>${aspirasi.judul}</strong></p></div>
                <div class="detail-row"><label>📅 Tanggal Dikirim:</label><p>${tanggal}</p></div>
                <div class="detail-row"><label>🔖 Status:</label><p><span class="status-badge ${aspirasi.dibaca ? 'dibaca' : 'belum'}">${aspirasi.dibaca ? '✅ Sudah Dibaca' : '❌ Belum Dibaca'}</span></p></div>
                <div class="detail-row"><label>💬 Isi Aspirasi:</label></div>
                <div style="background:#f5f5f5; padding:15px; border-radius:8px; margin-bottom:18px; white-space:pre-wrap; border-left:4px solid #2563eb;">${aspirasi.isi || '-'}</div>
                <div class="modal-buttons">
                    <button type="button" class="btn-cancel" onclick="closeModal()">Tutup</button>
                    ${!aspirasi.dibaca ? `<button type="button" class="btn-submit" onclick="markAsRead('${aspirasi.id}'); closeModal(); loadAspirasi();">Tandai Sudah Dibaca</button>` : ''}
                </div>
            </div>
        `;
        openModal();
    } catch (error) {
        console.error('Error:', error);
        showToast('Error membuka detail aspirasi', 'error');
    }
}

async function markAsRead(id) {
    await fetch(`${API_BASE}/superadmin-api/aspirasi/${id}/baca`, { method: 'PUT', headers: { 'Authorization': `Bearer ${adminToken}` } });
    loadAspirasi();
}

async function deleteAspirasi(id) {
    if(confirm('Hapus aspirasi ini?')) {
        await fetch(`${API_BASE}/superadmin-api/aspirasi/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` } });
        loadAspirasi(); loadDashboard();
    }
}

// ==================== KELOLA ADMIN ====================
async function loadAdmins() {
    try {
        const res = await fetch(`${API_BASE}/superadmin-api/admins`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
        const data = await res.json();
        const tbody = document.getElementById('adminTable');
        if (data.success && data.data.length) {
            tbody.innerHTML = data.data.map(admin => `
                <tr>
                    <td>${admin.username}</td>
                    <td><span class="status-badge dibaca">Admin</span></td>
                    <td>${new Date(admin.createdAt).toLocaleDateString('id-ID')}</td>
                    <td><button class="btn-delete" onclick="deleteAdmin('${admin.id}', '${admin.username}')">Hapus</button><\/td>
                <\/tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4">Belum ada admin selain Super Admin<\/td><\/tr>';
        }
    } catch(e) { console.error(e); }
}

function openTambahAdminForm() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h3>Tambah Admin Baru</h3>
        <form id="tambahAdminForm">
            <div class="form-group"><label>Username</label><input type="text" id="newUser" required></div>
            <div class="form-group"><label>Password</label><input type="password" id="newPass" required></div>
            <div class="modal-buttons"><button type="button" class="btn-cancel" onclick="closeModal()">Batal</button><button type="submit" class="btn-submit">Simpan</button></div>
        </form>
    `;
    document.getElementById('tambahAdminForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('newUser').value.trim();
        const password = document.getElementById('newPass').value;
        if(username.length < 3) { showToast('Username minimal 3 karakter', 'error'); return; }
        if(password.length < 4) { showToast('Password minimal 4 karakter', 'error'); return; }
        const res = await fetch(`${API_BASE}/superadmin-api/admins`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if(data.success) { showToast('Admin ditambahkan'); closeModal(); loadAdmins(); }
        else { showToast('Gagal: ' + data.message, 'error'); }
    });
    openModal();
}

async function deleteAdmin(id, username) {
    if(confirm(`Hapus admin "${username}"?`)) {
        await fetch(`${API_BASE}/superadmin-api/admins/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` } });
        loadAdmins();
    }
}

// ========== MODAL ==========
function openModal() { document.getElementById('formModal').classList.add('show'); }
function closeModal() { document.getElementById('formModal').classList.remove('show'); }
document.getElementById('formModal').addEventListener('click', (e) => { if(e.target === document.getElementById('formModal')) closeModal(); });

// ========== EXPOSE GLOBAL FUNCTIONS ==========
window.openKegiatanForm = openKegiatanForm;
window.openGaleriForm = openGaleriForm;
window.openDokumenForm = openDokumenForm;
window.openTambahAdminForm = openTambahAdminForm;
window.editKegiatan = editKegiatan;
window.deleteKegiatan = deleteKegiatan;
window.deleteGaleri = deleteGaleri;
window.deleteDokumen = deleteDokumen;
window.deleteAspirasi = deleteAspirasi;
window.markAsRead = markAsRead;
window.deleteAdmin = deleteAdmin;
window.closeModal = closeModal;

// ========== INIT ==========
if (adminToken) {
    const user = decodeToken(adminToken);
    if (user && user.role === 'superadmin') { showAdminDashboard(); }
    else { localStorage.removeItem('adminToken'); showLoginForm(); }
} else { showLoginForm(); }