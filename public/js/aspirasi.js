document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('aspirasiForm').addEventListener('submit', submitAspirasi);
});

async function submitAspirasi(e) {
    e.preventDefault();
    
    const data = {
        nama: document.getElementById('aspNama').value,
        email: document.getElementById('aspEmail').value,
        judul: document.getElementById('aspJudul').value,
        isi: document.getElementById('aspIsi').value
    };
    
    const response = await APIClient.post('/aspirasi', data);
    const messageBox = document.getElementById('aspirasiMessage');
    
    if (response.success) {
        messageBox.className = 'message-box success';
        messageBox.textContent = response.message;
        document.getElementById('aspirasiForm').reset();
    } else {
        messageBox.className = 'message-box error';
        messageBox.textContent = response.message;
    }
    
    messageBox.style.display = 'block';
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 3000);
}