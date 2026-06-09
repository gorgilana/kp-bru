let allGaleriImages = [];
let currentImageIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    loadGaleri();
    setupGalleryModal();
});

async function loadGaleri() {
    const data = await APIClient.get('/galeri');
    
    if (data.success) {
        const container = document.getElementById('galeriContainer');
        allGaleriImages = [];
        
        let htmlContent = '';
        data.data.forEach(galeri => {
            galeri.foto.forEach((foto, index) => {
                htmlContent += `
                    <div class="gallery-item" onclick="openGalleryModal(${allGaleriImages.length})">
                        <img src="${foto}" alt="Foto ${galeri.deskripsi}">
                        <div class="gallery-overlay">
                            <i class="fas fa-eye"></i>
                        </div>
                    </div>
                `;
                allGaleriImages.push({
                    src: foto,
                    caption: galeri.deskripsi
                });
            });
        });
        
        if (data.data.length === 0) {
            htmlContent = '<p style="grid-column: 1/-1; text-align: center;">Galeri belum ada foto</p>';
        }
        
        container.innerHTML = htmlContent;
    }
}

function setupGalleryModal() {
    const modal = document.getElementById('galleryModal');
    const closeBtn = document.querySelector('.close');
    const prevBtn = document.getElementById('prevImage');
    const nextBtn = document.getElementById('nextImage');
    
    closeBtn.onclick = () => modal.classList.remove('show');
    prevBtn.onclick = () => changeImage(-1);
    nextBtn.onclick = () => changeImage(1);
    
    modal.onclick = (e) => {
        if (e.target === modal) modal.classList.remove('show');
    };
}

function openGalleryModal(index) {
    const modal = document.getElementById('galleryModal');
    currentImageIndex = index;
    updateGalleryImage();
    modal.classList.add('show');
}

function changeImage(direction) {
    currentImageIndex += direction;
    if (currentImageIndex < 0) currentImageIndex = allGaleriImages.length - 1;
    if (currentImageIndex >= allGaleriImages.length) currentImageIndex = 0;
    updateGalleryImage();
}

function updateGalleryImage() {
    const image = allGaleriImages[currentImageIndex];
    document.getElementById('galleryImage').src = image.src;
    document.getElementById('galleryCaption').textContent = image.caption;
}