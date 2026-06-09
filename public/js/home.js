document.addEventListener('DOMContentLoaded', function() {
    loadHomeData();
    
    // Auto refresh data setiap 10 detik (10000 ms)
    setInterval(function() {
        console.log('🔄 Auto refresh statistik...');
        loadHomeData();
    }, 10000);
});

async function loadHomeData() {
    try {
        const data = await APIClient.get('/home');
        
        if (data.success) {
            // Update statistik (3 kolom)
            const statKegiatan = document.getElementById('statKegiatan');
            const statGaleri = document.getElementById('statGaleri');
            const statDokumen = document.getElementById('statDokumen');
            
            if (statKegiatan) statKegiatan.textContent = data.data.totalKegiatan;
            if (statGaleri) statGaleri.textContent = data.data.totalGaleri;
            if (statDokumen) statDokumen.textContent = data.data.totalDokumen;
            
            console.log('✅ Statistik terupdate:', {
                kegiatan: data.data.totalKegiatan,
                galeri: data.data.totalGaleri,
                dokumen: data.data.totalDokumen
            });
            
            const container = document.getElementById('recentKegiatanContainer');
            
            if (data.data.kegiatanTerbaru.length === 0) {
                container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Belum ada kegiatan</p>';
            } else {
                container.innerHTML = data.data.kegiatanTerbaru.map(kegiatan => `
                    <div class="kegiatan-card" onclick="viewKegiatan('${kegiatan.id}')">
                        <img src="${kegiatan.gambar[0] || 'https://via.placeholder.com/280x200'}" alt="${kegiatan.judul}" class="kegiatan-image">
                        <div class="kegiatan-content">
                            <h3>${kegiatan.judul}</h3>
                            <p class="kegiatan-meta">
                                <i class="fas fa-calendar"></i> ${new Date(kegiatan.tanggal).toLocaleDateString('id-ID')}
                            </p>
                            <p>${kegiatan.deskripsi.substring(0, 100)}...</p>
                        </div>
                    </div>
                `).join('');
            }
        } else {
            console.error('Gagal memuat data:', data);
        }
    } catch (error) {
        console.error('Error loading home data:', error);
    }
}

function viewKegiatan(id) {
    const section = document.getElementById('kegiatan');
    section.classList.add('active');
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    section.classList.add('active');
    loadKegiatanDetail(id);
}