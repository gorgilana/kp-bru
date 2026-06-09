let currentPage = 1;
let totalPages = 1;

document.addEventListener('DOMContentLoaded', function() {
    loadKegiatan();

    document.getElementById('kegiatanSearch').addEventListener('input', searchKegiatan);
});

async function loadKegiatan(page = 1) {
    const data = await APIClient.get(`/kegiatan?page=${page}`);
    
    if (data.success) {
        currentPage = data.page;
        totalPages = data.pages;
        
        const container = document.getElementById('kegiatanContainer');
        
        if (data.data.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Tidak ada kegiatan ditemukan</p>';
        } else {
            container.innerHTML = data.data.map(kegiatan => `
                <div class="kegiatan-article">
                    <img src="${kegiatan.gambar[0] || 'https://via.placeholder.com/300x250'}" alt="${kegiatan.judul}" class="kegiatan-article-image">
                    <div class="kegiatan-article-body">
                        <h2>${kegiatan.judul}</h2>
                        <div class="kegiatan-article-meta">
                            <span><i class="fas fa-calendar"></i> ${new Date(kegiatan.tanggal).toLocaleDateString('id-ID')}</span>
                            <span style="margin-left: 1rem;"><i class="fas fa-map-marker-alt"></i> ${kegiatan.lokasi}</span>
                        </div>
                        <p class="kegiatan-article-text">${kegiatan.deskripsi.substring(0, 200)}...</p>
                        <a href="javascript:loadKegiatanDetail('${kegiatan.id}')" class="btn-read-more">Baca Selengkapnya</a>
                    </div>
                </div>
            `).join('');
        }
        
        updatePagination();
    }
}

async function loadKegiatanDetail(id) {
    const data = await APIClient.get(`/kegiatan/${id}`);
    
    if (data.success) {
        const kegiatan = data.data;
        const container = document.getElementById('kegiatanContainer');
        
        const imageHTML = kegiatan.gambar.length > 0 
            ? kegiatan.gambar.map(img => `<img src="${img}" alt="Foto kegiatan" style="max-width: 100%; margin: 1rem 0; border-radius: 8px;">`).join('')
            : '';
        
        container.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                <button onclick="loadKegiatan()" style="background: var(--primary); color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 2rem;">
                    <i class="fas fa-arrow-left"></i> Kembali
                </button>
                <h2>${kegiatan.judul}</h2>
                <div class="kegiatan-article-meta" style="margin: 1rem 0;">
                    <span><i class="fas fa-calendar"></i> ${new Date(kegiatan.tanggal).toLocaleDateString('id-ID')}</span>
                    <span style="margin-left: 1rem;"><i class="fas fa-map-marker-alt"></i> ${kegiatan.lokasi}</span>
                </div>
                ${imageHTML}
                <div style="line-height: 1.8; color: #555;">
                    ${kegiatan.deskripsi.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
        
        document.getElementById('paginationContainer').innerHTML = '';
    }
}

function updatePagination() {
    const container = document.getElementById('paginationContainer');
    container.innerHTML = '';
    
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.className = i === currentPage ? 'active' : '';
        button.onclick = () => loadKegiatan(i);
        container.appendChild(button);
    }
}

function searchKegiatan() {
    const searchTerm = document.getElementById('kegiatanSearch').value.toLowerCase();
    const articles = document.querySelectorAll('.kegiatan-article');
    
    articles.forEach(article => {
        const text = article.textContent.toLowerCase();
        article.style.display = text.includes(searchTerm) ? 'grid' : 'none';
    });
}