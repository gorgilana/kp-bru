document.addEventListener('DOMContentLoaded', function() {
    loadDokumen();
});

async function loadDokumen() {
    const data = await APIClient.get('/dokumen');
    
    if (data.success) {
        const container = document.getElementById('dokumenContainer');
        
        if (data.data.length === 0) {
            container.innerHTML = '<p>Belum ada dokumen</p>';
        } else {
            container.innerHTML = data.data.map(dokumen => `
                <div class="dokumen-item">
                    <h3>${dokumen.judul}</h3>
                    <p>${dokumen.deskripsi}</p>
                    <div class="dokumen-files">
                        ${dokumen.file.map(f => `
                            <a href="${f.url}" download class="dokumen-file">
                                <i class="fas fa-download"></i> ${f.nama}
                            </a>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }
    }
}