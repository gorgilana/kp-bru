/**
 * FUNGSI GLOBAL
 * Diletakkan di luar agar bisa dipanggil dari mana saja
 */

// 1. Fungsi utama untuk berpindah section
function showSection(menuName) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    const activeSection = document.getElementById(menuName);
    if (activeSection) {
        activeSection.classList.add('active');
        // Scroll ke atas setiap kali pindah menu
        window.scrollTo(0, 0); 
    }

    // Update class 'active' pada link navigasi (navbar)
    const navLinks = document.querySelectorAll('[data-menu]');
    navLinks.forEach(link => {
        if (link.getAttribute('data-menu') === menuName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// 2. Fungsi navigasi dari tombol/card dengan proteksi protokol file
function goToMenu(menuName) {
    // Deteksi jika dibuka dari file lokal (file://)
    const isLocalFile = window.location.protocol === 'file:';
    
    // Jika lewat server, URL berubah jadi ?page=... 
    // Jika lewat file, URL tetap null agar tidak "Index of /"
    const newUrl = isLocalFile ? null : `?page=${menuName}`;
    
    // Simpan ke history browser
    history.pushState({ menu: menuName }, "", newUrl);
    
    // Tampilkan halamannya
    showSection(menuName);
    
    // Pastikan menu mobile tertutup
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.remove('active');
}


/**
 * EVENT LISTENERS
 */
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Inisialisasi State Awal
    // Mencegah klik BACK pertama kali langsung keluar ke Google
    if (!history.state) {
        history.replaceState({ menu: 'home' }, "Home", "");
    }

    const navMenu = document.getElementById('navMenu');
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelectorAll('[data-menu]');

    // 2. Logika Toggle Menu Mobile
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // 3. Logika Klik Link Navigasi (Navbar)
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); 
            
            const menuName = this.getAttribute('data-menu');
            const isLocalFile = window.location.protocol === 'file:';
            const newUrl = isLocalFile ? null : `?page=${menuName}`;
            
            // Simpan history & ganti section
            history.pushState({ menu: menuName }, "", newUrl);
            showSection(menuName);
            
            if (navMenu) navMenu.classList.remove('active');
        });
    });

    // 4. Deteksi Halaman Awal (Default View)
    // Jika ada parameter ?page= di URL, buka itu. Jika tidak, buka home.
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');
    if (pageParam) {
        showSection(pageParam);
    } else {
        showSection('home');
    }

    // 5. Fitur Smooth Scroll
    document.querySelectorAll('a[href*="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#') && href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
});


/**
 * HANDLE TOMBOL BACK/FORWARD BROWSER
 */
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.menu) {
        // Tampilkan section tanpa membuat history pushState baru
        showSection(event.state.menu);
    } else {
        showSection('home');
    }
});