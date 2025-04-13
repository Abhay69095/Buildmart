import config from './config.js';

// Add at the beginning of the file
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav');

menuToggle.addEventListener('click', () => {
    document.body.classList.toggle('menu-open');
    nav.classList.toggle('active');
    
    // Toggle overlay
    const overlay = document.querySelector('.nav-overlay');
    if (!overlay) {
        const div = document.createElement('div');
        div.className = 'nav-overlay';
        document.body.appendChild(div);
        div.classList.add('active');
        
        // Close menu when clicking overlay
        div.addEventListener('click', () => {
            document.body.classList.remove('menu-open');
            nav.classList.remove('active');
            div.remove();
        });
    } else {
        overlay.remove();
    }
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !menuToggle.contains(e.target)) {
        nav.classList.remove('active');
        menuToggle.querySelector('i').classList.add('fa-bars');
        menuToggle.querySelector('i').classList.remove('fa-times');
    }
});

// Close menu when clicking on nav links
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('active');
        menuToggle.querySelector('i').classList.add('fa-bars');
        menuToggle.querySelector('i').classList.remove('fa-times');
    });
});

// Add resize handler
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        nav.classList.remove('active');
        menuToggle.querySelector('i').classList.add('fa-bars');
        menuToggle.querySelector('i').classList.remove('fa-times');
    }
});

// Update contact form handling
document.querySelector('.inquiry-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get all form input values
    const formData = {
        name: this.querySelector('input[type="text"]').value,
        email: this.querySelector('input[type="email"]').value,
        phone: this.querySelector('input[type="tel"]').value,
        message: this.querySelector('textarea').value,
        status: 'unread',
        createdAt: new Date()
    };

    try {
        showLoading();
        const response = await fetch(`${config.API_URL}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Failed to send inquiry');
        }

        hideLoading();
        alert('Thank you for your inquiry. We will get back to you shortly!');
        this.reset();
    } catch (error) {
        hideLoading();
        console.error('Error sending inquiry:', error);
        alert('Failed to send inquiry. Please try again.');
    }
});

// Smooth scrolling
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        smoothScroll(this.getAttribute('href'));
    });
});

// Enhanced smooth scroll
const smoothScroll = (target) => {
    const element = document.querySelector(target);
    const headerOffset = 60; // Updated to match new header height
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
    });
};

// Simple responsive menu
const createResponsiveMenu = () => {
    const nav = document.querySelector('nav');
    const header = document.querySelector('header');
    
    if (window.innerWidth <= 768) {
        header.style.padding = '1rem';
    } else {
        header.style.padding = '1rem 2rem';
    }
};

window.addEventListener('resize', createResponsiveMenu);
window.addEventListener('load', createResponsiveMenu);

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Map initialization
document.addEventListener('DOMContentLoaded', function() {
    // Replace these coordinates with your actual store location
    const storeLocation = [18.5204, 73.8567]; // Example: Pune coordinates
    
    const map = L.map('map').setView(storeLocation, 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Custom marker icon
    const storeIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    
    // Add marker with popup
    const marker = L.marker(storeLocation, {icon: storeIcon}).addTo(map);
    marker.bindPopup(`
        <strong>BuildMart Construction Materials</strong><br>
        123 Construction Avenue<br>
        Building District, City 12345<br>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${storeLocation[0]},${storeLocation[1]}" 
           target="_blank">Get Directions</a>
    `).openPopup();
    
    // Refresh map when contact section becomes visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                map.invalidateSize();
            }
        });
    });
    
    observer.observe(document.querySelector('#contact'));
});

// Add slider functionality
document.addEventListener('DOMContentLoaded', function() {
    const slider = {
        container: document.querySelector('.slider'),
        slides: document.querySelectorAll('.slide'),
        dots: document.querySelector('.slider-dots'),
        prevBtn: document.querySelector('.prev'),
        nextBtn: document.querySelector('.next'),
        currentSlide: 0,
        interval: null,
        
        init() {
            // Create dots
            this.slides.forEach((_, index) => {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                if (index === 0) dot.classList.add('active');
                dot.addEventListener('click', () => this.goToSlide(index));
                this.dots.appendChild(dot);
            });
            
            // Add button listeners
            if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prevSlide());
            if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextSlide());
            
            // Start auto sliding
            this.startAutoSlide();
            
            // Pause on hover
            if (this.container) {
                this.container.addEventListener('mouseenter', () => this.stopAutoSlide());
                this.container.addEventListener('mouseleave', () => this.startAutoSlide());
            }
        },
        
        goToSlide(index) {
            this.slides[this.currentSlide].classList.remove('active');
            document.querySelectorAll('.dot')[this.currentSlide].classList.remove('active');
            
            this.currentSlide = index;
            
            this.slides[this.currentSlide].classList.add('active');
            document.querySelectorAll('.dot')[this.currentSlide].classList.add('active');
        },
        
        nextSlide() {
            const next = (this.currentSlide + 1) % this.slides.length;
            this.goToSlide(next);
        },
        
        prevSlide() {
            const prev = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
            this.goToSlide(prev);
        },
        
        startAutoSlide() {
            this.interval = setInterval(() => this.nextSlide(), 5000);
        },
        
        stopAutoSlide() {
            clearInterval(this.interval);
        }
    };
    
    slider.init();
});

// Gallery Lightbox
document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', function() {
        const imgSrc = this.querySelector('.gallery-img').src;
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        
        if (lightbox && lightboxImg) {
            lightboxImg.src = imgSrc;
            lightbox.classList.add('active');
        }
    });
});

const closeLightbox = document.querySelector('.close-lightbox');
if (closeLightbox) {
    closeLightbox.addEventListener('click', () => {
        const lightbox = document.getElementById('lightbox');
        if (lightbox) {
            lightbox.classList.remove('active');
        }
    });
}

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const faqItem = question.parentElement;
        const isActive = faqItem.classList.contains('active');
        
        // Close all FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Open clicked item if it wasn't active
        if (!isActive) {
            faqItem.classList.add('active');
        }
    });
});

// Newsletter Subscription
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = this.querySelector('input[type="email"]').value;
        
        // Here you would typically send the email to your server
        alert('Thank you for subscribing! You will receive our newsletter soon.');
        this.reset();
    });
}

// Auth Modal Functionality
const authState = {
    isLoggedIn: false,
    currentUser: null
};

// Modal Elements
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const showLogin = document.getElementById('showLogin');
const showSignup = document.getElementById('showSignup');
const closeBtns = document.querySelectorAll('.close-modal');

// Show modals on page load
window.addEventListener('DOMContentLoaded', () => {
    // Only show login modal if we have one and user isn't logged in
    if (loginModal && !authState.isLoggedIn) {
        setTimeout(() => {
            loginModal.style.display = 'block';
        }, 2000);
    }
});

// Switch between modals
if (showLogin) {
    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        if (signupModal) signupModal.style.display = 'none';
        if (loginModal) loginModal.style.display = 'block';
    });
}

if (showSignup) {
    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        if (loginModal) loginModal.style.display = 'none';
        if (signupModal) signupModal.style.display = 'block';
    });
}

// Close modals
closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (loginModal) loginModal.style.display = 'none';
        if (signupModal) signupModal.style.display = 'none';
    });
});

// Close on outside click
window.addEventListener('click', (e) => {
    if (loginModal && e.target === loginModal) {
        loginModal.style.display = 'none';
    }
    if (signupModal && e.target === signupModal) {
        signupModal.style.display = 'none';
    }
});

const API_URL = 'http://localhost:3000/api';

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${config.API_URL}${endpoint}`, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {}),
                ...options.headers
            }
        });
        
        if (response.status === 401) {
            // Token expired or invalid
            tokenManager.clearToken();
            showLoginModal();
            throw new Error('Session expired');
        }
        
        if (!response.ok) {
            throw new Error(await response.text());
        }
        
        return response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Add token management
const tokenManager = {
    accessToken: null,
    refreshTimer: null,
    
    setToken(token, expiresIn) {
        this.accessToken = token;
        localStorage.setItem('token', token);
        
        // Set up refresh timer
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        
        // Refresh 1 minute before expiry
        const refreshTime = (expiresIn - 60) * 1000;
        this.refreshTimer = setTimeout(() => this.refreshToken(), refreshTime);
    },
    
    async refreshToken() {
        try {
            const response = await fetch(`${config.API_URL}/refresh-token`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': this.getToken()
                }
            });
            
            if (!response.ok) {
                throw new Error('Refresh failed');
            }
            
            const data = await response.json();
            this.setToken(data.token, data.expiresIn);
            return data.token;
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.clearToken();
            return null;
        }
    },
    
    async ensureValidToken() {
        const token = this.getToken();
        if (!token) {
            return null;
        }
        
        try {
            // Attempt to decode token to check expiration
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            
            // Check if token is expired or will expire in next 30 seconds
            if (payload.exp && payload.exp * 1000 <= Date.now() + 30000) {
                return await this.refreshToken();
            }
            
            return token;
        } catch (error) {
            console.error('Token validation error:', error);
            return await this.refreshToken();
        }
    },
    
    getToken() {
        return this.accessToken || localStorage.getItem('token');
    },
    
    clearToken() {
        this.accessToken = null;
        localStorage.removeItem('token');
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
    }
};

// Add safe token management functions
function getTokenSafely() {
    try {
        return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
    } catch (error) {
        console.warn('Storage access denied, falling back to memory storage');
        return tokenManager.accessToken;
    }
}

async function refreshTokenSafely() {
    try {
        return await tokenManager.refreshToken();
    } catch (error) {
        console.error('Token refresh failed:', error);
        handleAuthError();
    }
}

// Updated Auth Functions
async function login(email, password) {
    try {
        console.log('Attempting login for:', email);
        
        const response = await fetch(`${config.API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }

        const data = await response.json();
        console.log('Login successful:', data);

        // Store token with Bearer prefix
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Updated register function
async function register(name, email, password) {
    try {
        const response = await fetch(`${config.API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
        }

        const data = await response.json();
        
        // Store token with Bearer prefix
        const token = data.token.startsWith('Bearer ') ? data.token : `Bearer ${data.token}`;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        return data;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// Update existing login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.elements[0].value;
    const password = e.target.elements[1].value;
    
    try {
        showLoading();
        const data = await login(email, password);
        
        // Check if this login was triggered while trying to access admin panel
        const adminPending = sessionStorage.getItem('adminPending');
        
        if (data.user.role === 'admin' && adminPending) {
            sessionStorage.removeItem('adminPending');
            window.location.href = '/admin/admin.html';
        } else {
            // Regular login flow
            updateAuthUI();
            loginModal.style.display = 'none';
        }
        
        e.target.reset();
    } catch (error) {
        alert(error.message || 'Login failed');
    } finally {
        hideLoading();
    }
});

// Update signup form handler
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = e.target.elements[0].value;
    const email = e.target.elements[1].value;
    const password = e.target.elements[2].value;
    const confirmPassword = e.target.elements[3].value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    try {
        showLoading();
        const data = await register(name, email, password);
        
        // Clear the signup form
        e.target.reset();
        
        // Hide signup modal
        signupModal.style.display = 'none';
        
        // Show success message
        alert('Registration successful! Please login to continue.');
        
        // Show login modal
        loginModal.style.display = 'block';
        
        // Pre-fill the email in login form
        document.querySelector('#loginForm input[type="email"]').value = email;
        
    } catch (error) {
        alert(error.message || 'Registration failed');
    } finally {
        hideLoading();
    }
});

// Loading State Functions
function showLoading() {
    const loader = document.createElement('div');
    loader.className = 'loader';
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.remove();
    }
}

// Add loader styles
const styles = document.createElement('style');
styles.textContent = `
    .loader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }
    
    .loader::after {
        content: '';
        width: 50px;
        height: 50px;
        border: 5px solid #fff;
        border-top-color: var(--accent-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(styles);

// Update auth UI function
function updateAuthUI() {
    const authContainer = document.querySelector('.auth-buttons');
    if (!authContainer) {
        document.querySelector('.header-content').insertAdjacentHTML(
            'beforeend',
            '<div class="auth-buttons"></div>'
        );
    }
    
    const user = JSON.parse(localStorage.getItem('user'));
    let buttonsHtml = '';
    
    if (user && localStorage.getItem('token')) {
        // User is logged in
        buttonsHtml = `
            <div class="user-info">
                <span>${user.name || user.email}</span>
            </div>
            ${user.role === 'admin' ? 
                `<button class="auth-btn admin-panel-btn" onclick="goToAdmin()">
                    <i class="fas fa-cog"></i>
                    Admin Panel
                </button>` : ''
            }
            <button class="auth-btn logout" onclick="handleLogout()">
                <i class="fas fa-sign-out-alt"></i>
                Logout
            </button>
        `;
    } else {
        // User is not logged in
        buttonsHtml = `
            <button class="auth-btn" onclick="window.showLoginModal()">
                <i class="fas fa-sign-in-alt"></i> Login
            </button>
            <button class="auth-btn" onclick="window.showSignupModal()">
                <i class="fas fa-user-plus"></i> Sign Up
            </button>
        `;
    }
    
    document.querySelector('.auth-buttons').innerHTML = buttonsHtml;
}

// Update goToAdmin function
window.goToAdmin = async function() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!token || !user) {
            throw new Error('Please login first');
        }

        if (user.role === 'admin') {
            // Get the current path and determine correct relative path
            const currentPath = window.location.pathname;
            let adminPath;
            
            // Handle different directory depths
            if (currentPath.includes('/pages/') || currentPath.includes('/products/')) {
                adminPath = '../admin/admin.html'; // Go up one level
            } else {
                adminPath = './admin/admin.html'; // Same level
            }
            
            // Ensure token has Bearer prefix before navigating
            if (token && !token.startsWith('Bearer ')) {
                localStorage.setItem('token', `Bearer ${token}`);
                console.log('Updated token format before admin navigation');
            }
            
            // Navigate directly to admin panel
            window.location.href = adminPath;
            return;
        }

        throw new Error('Admin access required');
    } catch (error) {
        console.error('Admin access error:', error);
        if (error.message.includes('login first')) {
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.style.display = 'block';
            }
        } else {
            alert('Access denied. Admin privileges required.');
        }
    }
};

// Add this function to check admin status on page load
function checkAndShowAdminButton() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role === 'admin') {
        const adminBtn = document.createElement('button');
        adminBtn.className = 'auth-btn admin-panel-btn';
        adminBtn.onclick = goToAdmin;
        adminBtn.innerHTML = `
            <i class="fas fa-cog"></i>
            Admin Panel
        `;
        document.querySelector('.auth-buttons').appendChild(adminBtn);
    }
}

// Update the DOMContentLoaded event
document.addEventListener('DOMContentLoaded', () => {
    // ...existing code...
    
    checkAndShowAdminButton();
    
    // ...existing code...
});

// Update token management
function getTokenWithBearer() {
    const token = localStorage.getItem('token');
    return token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : null;
}

// Add function to verify token format
function validateAndFormatToken() {
    const token = localStorage.getItem('token');
    if (token && !token.startsWith('Bearer ')) {
        const formattedToken = `Bearer ${token}`;
        localStorage.setItem('token', formattedToken);
        return formattedToken;
    }
    return token;
}

// Update logout function
async function handleLogout() {
    try {
        showLoading();
        
        // Call logout API endpoint
        await fetch(`${config.API_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        // Clear all stored user data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('adminAccess');
        
        // Close mobile menu if open
        if (nav.classList.contains('active')) {
            closeMenu();
        }

        // Update UI
        updateAuthUI();
        
        // Redirect to home page
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
    } finally {
        hideLoading();
    }
}

// Make sure these functions are globally accessible
window.showLoginModal = showLoginModal;
window.showSignupModal = showSignupModal;
window.handleLogout = handleLogout;

// Initialize auth state from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (token && user) {
        authState.isLoggedIn = true;
        authState.currentUser = user.name || user.email;
        // Don't show login modal if user is already logged in
        updateAuthUI();
    } else {
        // Only show login modal if user is not logged in
        setTimeout(() => {
            loginModal.style.display = 'block';
        }, 2000);
    }
});

// Initialize auth UI
document.querySelector('.header-content').insertAdjacentHTML(
    'beforeend',
    '<div class="auth-buttons"></div>'
);
updateAuthUI();

// Add these product-related functions
async function loadProducts() {
    try {
        showLoading();
        console.log('Fetching products...');
        
        const response = await fetch(`${config.API_URL}/products`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        console.log('Products received:', products);
        
        if (!Array.isArray(products)) {
            console.error('Invalid products data:', products);
            throw new Error('Invalid products data received');
        }
        
        const categorizedProducts = groupByCategory(products);
        displayProducts(categorizedProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        handleProductLoadError();
    } finally {
        hideLoading();
    }
}

function groupByCategory(products) {
    return products.reduce((acc, product) => {
        if (!acc[product.category]) {
            acc[product.category] = [];
        }
        acc[product.category].push(product);
        return acc;
    }, {});
}

function displayProducts(categorizedProducts) {
    const productContainer = document.querySelector('.product-categories');
    
    if (Object.keys(categorizedProducts).length === 0) {
        productContainer.innerHTML = `
            <div class="no-products">
                <p>No products available at the moment.</p>
            </div>
        `;
        return;
    }

    // Combine all products into a single array
    const allProducts = Object.values(categorizedProducts).flat();
    
    // Get 4 random products
    const displayProducts = getRandomProducts(allProducts, 4);

    const productHTML = `
        <div class="category">
            <h3>Featured Products</h3>
            <div class="product-grid">
                ${renderProducts(displayProducts)}
            </div>
            <div class="show-more-container">
                <button class="view-all-btn" onclick="showAllProducts()">
                    View All Products <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;

    productContainer.innerHTML = productHTML;
}

// Add these new functions
function getRandomProducts(products, count) {
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function startProductRotation(allProducts) {
    setInterval(() => {
        const productGrid = document.querySelector('.product-grid');
        if (productGrid) {
            const newProducts = getRandomProducts(allProducts, 4);
            productGrid.style.opacity = '0';
            setTimeout(() => {
                productGrid.innerHTML = renderProducts(newProducts);
                productGrid.style.opacity = '1';
            }, 500);
        }
    }, 30000); // Rotate every 30 seconds
}

function renderProducts(products) {
    return products.map(product => `
        <div class="product-item">
            <img src="${product.imageUrl || 'default-product-image.jpg'}" 
                 alt="${product.name}"
                 onerror="this.src='https://via.placeholder.com/300x200?text=Product+Image'">
            <div class="product-item-content">
                <h4>${product.name}</h4>
                <p>${product.description || 'No description available'}</p>
                <p class="price">₹${product.price.toLocaleString('en-IN') || 'N/A'}</p>
                <p class="stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                    ${product.stock > 0 ? `In Stock (${product.stock} units)` : 'Out of Stock'}
                </p>
                <button class="inquiry-btn" onclick="navigateToContact('${product.name}')">
                    <i class="fas fa-envelope"></i> Enquire Now
                </button>
            </div>
        </div>
    `).join('');
}

// Add function to handle contact navigation
function navigateToContact(productName) {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
        // Smooth scroll to contact section
        contactSection.scrollIntoView({ behavior: 'smooth' });
        
        // Pre-fill the message with product name
        const messageArea = document.querySelector('.inquiry-form textarea');
        if (messageArea) {
            messageArea.value = `I would like to inquire about ${productName}.`;
        }
        
        // Focus the name input
        const nameInput = document.querySelector('.inquiry-form input[type="text"]');
        if (nameInput) {
            nameInput.focus();
        }
    }
}

// Make the function available globally
window.navigateToContact = navigateToContact;

// Add search functionality
function setupProductSearch() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search products...';
    searchInput.className = 'product-search';

    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.appendChild(searchInput);

    const productsSection = document.querySelector('#products');
    productsSection.insertBefore(searchContainer, productsSection.firstChild);

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            searchProducts(e.target.value);
        }, 300);
    });
}

async function searchProducts(query) {
    try {
        showLoading();
        const products = await apiRequest(`/products?search=${encodeURIComponent(query)}`);
        const categorizedProducts = groupByCategory(products);
        displayProducts(categorizedProducts);
        hideLoading();
    } catch (error) {
        console.error('Error searching products:', error);
        hideLoading();
    }
}

// Add error handling functions
function handleApiError(error) {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = 'Unable to load products. Please try again later.';
    
    const productsContainer = document.querySelector('.product-categories');
    productsContainer.innerHTML = '';
    productsContainer.appendChild(errorMessage);
}

function handleProductLoadError() {
    const productContainer = document.querySelector('.product-categories');
    productContainer.innerHTML = `
        <div class="error-container">
            <p>Unable to load products. Please try again.</p>
            <button onclick="retryLoadProducts()" class="retry-btn">
                <i class="fas fa-sync"></i> Retry Loading Products
            </button>
        </div>
    `;
}

function handleAuthError() {
    // Clear stored credentials
    try {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        tokenManager.clearToken();
    } catch (error) {
        console.warn('Storage access denied during cleanup');
    }
    
    // Redirect to login
    window.location.href = '/login';
}

// Add retry function
async function retryLoadProducts() {
    await loadProducts();
}

// Initialize products on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await retryLoadProducts();
        setupProductSearch();
    } catch (error) {
        console.error('Initialization error:', error);
        handleProductLoadError();
    }
});

// Add these styles
const productStyles = document.createElement('style');
productStyles.textContent = `
    .search-container {
        margin: 2rem auto;
        max-width: 600px;
        text-align: center;
    }

    .product-search {
        width: 100%;
        padding: 1rem;
        border: 2px solid var(--primary-color);
        border-radius: 25px;
        font-size: 1.1rem;
        transition: all 0.3s ease;
    }

    .product-search:focus {
        outline: none;
        box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
    }

    .stock-status {
        font-weight: bold;
        margin: 0.5rem 0;
    }

    .in-stock {
        color: #4CAF50;
    }

    .out-of-stock {
        color: #f44336;
    }

    .inquiry-btn {
        background: var(--accent-color);
        color: white;
        border: none;
        padding: 0.8rem 1.5rem;
        border-radius: 25px;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 100%;
        margin-top: 1rem;
    }

    .inquiry-btn:hover {
        background: var(--secondary-color);
        transform: translateY(-2px);
    }
`;
document.head.appendChild(productStyles);

// Add these styles for error handling
const errorStyles = document.createElement('style');
errorStyles.textContent = `
    .error-container {
        text-align: center;
        padding: 2rem;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .error-message {
        color: #dc3545;
        text-align: center;
        padding: 1rem;
        margin: 1rem 0;
    }

    .retry-btn {
        background: var(--accent-color);
        color: white;
        border: none;
        padding: 0.8rem 1.5rem;
        border-radius: 25px;
        cursor: pointer;
        margin-top: 1rem;
        transition: all 0.3s ease;
    }

    .retry-btn:hover {
        background: var(--secondary-color);
        transform: translateY(-2px);
    }

    .retry-btn i {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(errorStyles);

// Add these styles for enhanced admin button
const adminStyles = document.createElement('style');
adminStyles.textContent = `
    .auth-buttons-container {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .admin-panel-btn {
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: var(--dark-color);
        padding: 0.5rem 1rem;
        border-radius: 25px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
        transition: all 0.3s ease;
    }

    .admin-panel-btn i {
        font-size: 1.1rem;
        transition: transform 0.3s ease;
    }

    .admin-panel-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
        background: linear-gradient(135deg, var(--secondary-color), var(--accent-color));
        color: white;
    }

    .admin-panel-btn:hover i {
        transform: rotate(180deg);
    }

    .logout {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .logout i {
        font-size: 1.1rem;
    }

    .user-info {
        padding: 0.5rem 1rem;
        border-radius: 25px;
        display: flex;
        align-items: center;
        gap: 1.5rem;
    }

    .user-info span {
        color: var(--primary-color);
        font-weight: 500;
        white-space: nowrap;
    }
`;
document.head.appendChild(adminStyles);

// Add retry functionality
function handleProductLoadError() {
    const productContainer = document.querySelector('.product-categories');
    productContainer.innerHTML = `
        <div class="error-container">
            <p>Unable to load products. Please try again.</p>
            <button onclick="retryLoadProducts()" class="retry-btn">
                <i class="fas fa-sync"></i> Retry Loading Products
            </button>
        </div>
    `;
}

// Add this style for no products message
const noProductsStyle = document.createElement('style');
noProductsStyle.textContent = `
    .no-products {
        text-align: center;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .error-container {
        text-align: center;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .retry-btn {
        margin-top: 1rem;
        padding: 0.8rem 1.5rem;
        background: var(--accent-color);
        color: white;
        border: none;
        border-radius: 25px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.3s ease;
    }

    .retry-btn:hover {
        background: var(--secondary-color);
        transform: translateY(-2px);
    }

    .retry-btn i {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(noProductsStyle);

// Initialize products on page load with retry capability
window.retryLoadProducts = async function() {
    const productContainer = document.querySelector('.product-categories');
    productContainer.innerHTML = '<div class="loading-placeholder">Loading products...</div>';
    await loadProducts();
};

// Update the document ready handler
document.addEventListener('DOMContentLoaded', async () => {
    // ...existing initialization code...
    await retryLoadProducts();
});

// Add these functions before they are used
function showLoginModal() {
    loginModal.style.display = 'block';
    signupModal.style.display = 'none';
}

function showSignupModal() {
    signupModal.style.display = 'block';
    loginModal.style.display = 'none';
}

// Update gallery with product images
async function updateGallery() {
    try {
        const products = await fetch(`${config.API_URL}/products`).then(res => res.json());
        const galleryGrid = document.querySelector('.gallery-grid');
        
        if (!galleryGrid) return;
        
        // Only take the first 4 products
        const displayProducts = products.slice(0, 4);
        
        galleryGrid.innerHTML = displayProducts.map(product => `
            <div class="gallery-item">
                <img src="${product.imageUrl || 'https://via.placeholder.com/300x200?text=Product+Image'}" 
                     alt="${product.name}"
                     class="gallery-img"
                     onerror="this.src='https://via.placeholder.com/300x200?text=Product+Image'">
                <div class="gallery-overlay">
                    <h3>${product.name}</h3>
                    <p>${product.category}</p>
                    <p>₹${product.price.toLocaleString('en-IN')}</p>
                    <button class="view-btn" onclick="showProductDetails('${product._id}')">
                        View Details
                    </button>
                </div>
            </div>
        `).join('');

        // Update lightbox functionality
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', function(e) {
                if (!e.target.classList.contains('view-btn')) {
                    const imgSrc = this.querySelector('.gallery-img').src;
                    const productName = this.querySelector('h3').textContent;
                    showLightbox(imgSrc, productName);
                }
            });
        });
    } catch (error) {
        console.error('Error updating gallery:', error);
    }
}

// Enhanced lightbox functionality
function showLightbox(imgSrc, title) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    
    lightboxImg.src = imgSrc;
    lightbox.classList.add('active');
    
    // Add title to lightbox if not exists
    if (!document.querySelector('.lightbox-title')) {
        const titleDiv = document.createElement('div');
        titleDiv.className = 'lightbox-title';
        lightbox.insertBefore(titleDiv, lightboxImg);
    }
    document.querySelector('.lightbox-title').textContent = title;
}

// Initialize gallery when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
    // ...existing initialization code...
    await updateGallery();
});

// Add product details modal
function showProductDetails(productId) {
    // Implementation for showing product details modal
    // You can add this functionality later if needed
}

// Update showAllProducts function
function showAllProducts() {
    window.location.href = 'all product.html';
}

// Update menu toggle functionality
const authButtons = document.querySelector('.auth-buttons');

menuToggle.addEventListener('click', () => {
    document.body.classList.toggle('menu-open');
    nav.classList.toggle('active');
    menuToggle.classList.toggle('active');
    
    // Toggle hamburger icon
    const icon = menuToggle.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
    
    // Toggle overlay
    const overlay = document.querySelector('.nav-overlay');
    if (!overlay) {
        const div = document.createElement('div');
        div.className = 'nav-overlay';
        document.body.appendChild(div);
        
        // Animate overlay
        setTimeout(() => div.classList.add('active'), 0);
        
        // Add click handler to overlay
        div.addEventListener('click', closeMenu);
    } else {
        // Remove overlay with animation
        existingOverlay.classList.remove('active');
        setTimeout(() => existingOverlay.remove(), 300);
    }
});

// Update auth UI function
function updateAuthUI() {
    const authContainer = document.querySelector('.auth-buttons');
    if (!authContainer) {
        document.querySelector('.header-content').insertAdjacentHTML(
            'beforeend',
            '<div class="auth-buttons"></div>'
        );
    }
    
    const user = JSON.parse(localStorage.getItem('user'));
    let buttonsHtml = '';
    
    if (user && localStorage.getItem('token')) {
        // User is logged in
        buttonsHtml = `
            <div class="user-info">
                <span>${user.name || user.email}</span>
            </div>
            ${user.role === 'admin' ? 
                `<button class="auth-btn admin-panel-btn" onclick="goToAdmin()">
                    <i class="fas fa-cog"></i>
                    Admin Panel
                </button>` : ''
            }
            <button class="auth-btn logout" onclick="handleLogout()">
                <i class="fas fa-sign-out-alt"></i>
                Logout
            </button>
        `;
    } else {
        // User is not logged in
        buttonsHtml = `
            <button class="auth-btn" onclick="window.showLoginModal()">
                <i class="fas fa-sign-in-alt"></i> Login
            </button>
            <button class="auth-btn" onclick="window.showSignupModal()">
                <i class="fas fa-user-plus"></i> Sign Up
            </button>
        `;
    }
    
    document.querySelector('.auth-buttons').innerHTML = buttonsHtml;
}

// Update menu toggle functionality
if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        // Toggle menu state
        document.body.classList.toggle('menu-open');
        nav.classList.toggle('active');
        
        // Toggle hamburger icon
        const icon = menuToggle.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
        
        // Handle overlay
        handleOverlay();
    });
}

// Separate overlay handling
function handleOverlay() {
    const existingOverlay = document.querySelector('.nav-overlay');
    
    if (!existingOverlay) {
        // Create and add overlay
        const overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        document.body.appendChild(overlay);
        
        // Animate overlay
        setTimeout(() => overlay.classList.add('active'), 0);
        
        // Add click handler to overlay
        overlay.addEventListener('click', closeMenu);
    } else {
        // Remove overlay with animation
        existingOverlay.classList.remove('active');
        setTimeout(() => existingOverlay.remove(), 300);
    }
}

// Separate close menu function
function closeMenu() {
    document.body.classList.remove('menu-open');
    nav.classList.remove('active');
    
    const icon = menuToggle.querySelector('i');
    if (icon) {
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-times');
    }
    
    const overlay = document.querySelector('.nav-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }
    
    // Ensure auth buttons are correctly positioned
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        authButtons.style.display = '';
    }
}

// Close menu when clicking navigation links
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', closeMenu);
});

// Close menu on window resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        closeMenu();
    }
});

// ...existing code...

// Update handleLogout function
async function handleLogout() {
    try {
        showLoading();
        
        // Call logout API endpoint
        await fetch(`${config.API_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        // Clear all stored user data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('adminAccess');
        
        // Close mobile menu if open
        if (nav.classList.contains('active')) {
            closeMenu();
        }

        // Update UI
        updateAuthUI();
        
        // Redirect to home page
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
    } finally {
        hideLoading();
    }
}

// Make sure these functions are globally accessible
window.showLoginModal = showLoginModal;
window.showSignupModal = showSignupModal;
window.handleLogout = handleLogout;

// ...existing code...

// Update closeMenu function to handle auth buttons
function closeMenu() {
    document.body.classList.remove('menu-open');
    nav.classList.remove('active');
    
    const icon = menuToggle.querySelector('i');
    if (icon) {
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-times');
    }
    
    const overlay = document.querySelector('.nav-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }
    
    // Ensure auth buttons are correctly positioned
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        authButtons.style.display = '';
    }
}

// ...existing code...

function showAdminPanel() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // First check for the link in the navbar
        const adminLink = document.getElementById('adminPanelLink');
        if (adminLink) {
            adminLink.style.display = (user && user.role === 'admin') ? 'block' : 'none';
            
            // Update href to prevent default navigation
            const linkElement = adminLink.querySelector('a');
            if (linkElement) {
                linkElement.onclick = function(e) {
                    e.preventDefault();
                    goToAdmin();
                };
            }
        }
        
        // Also check for admin buttons elsewhere in the page
        const adminBtns = document.querySelectorAll('.admin-panel-btn');
        adminBtns.forEach(btn => {
            if (user && user.role === 'admin') {
                btn.style.display = 'inline-block';
                btn.onclick = goToAdmin;
            } else {
                btn.style.display = 'none';
            }
        });
    } catch (error) {
        console.error('Error in showAdminPanel:', error);
    }
}

// Add this to your login success handler
function handleLoginSuccess(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    showAdminPanel();
    closeAuthModals();
    // ...rest of your login success code...
}

// Add to your DOMContentLoaded event
document.addEventListener('DOMContentLoaded', () => {
    // ...existing code...
    showAdminPanel();
});

// ...existing code...

// Update goToAdmin function
window.goToAdmin = async function() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!token || !user) {
            throw new Error('Please login first');
        }

        if (user.role === 'admin') {
            // Get the current path and determine correct relative path
            const currentPath = window.location.pathname;
            let adminPath;
            
            // Handle different directory depths
            if (currentPath.includes('/pages/') || currentPath.includes('/products/')) {
                adminPath = '../admin/admin.html'; // Go up one level
            } else {
                adminPath = './admin/admin.html'; // Same level
            }
            
            // Ensure token has Bearer prefix before navigating
            if (token && !token.startsWith('Bearer ')) {
                localStorage.setItem('token', `Bearer ${token}`);
                console.log('Updated token format before admin navigation');
            }
            
            // Navigate directly to admin panel
            window.location.href = adminPath;
            return;
        }

        throw new Error('Admin access required');
    } catch (error) {
        console.error('Admin access error:', error);
        if (error.message.includes('login first')) {
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.style.display = 'block';
            }
        } else {
            alert('Access denied. Admin privileges required.');
        }
    }
};

// Only one showAdminPanel function - removed duplicate
// ... existing code ...

// Add API URL configuration
const API_BASE_URL = 'https://buildmart-api.onrender.com/api';

// Update all fetch calls to use API_BASE_URL
async function loadProducts() {
    try {
        showLoading();
        console.log('Fetching products...');
        
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        console.log('Products received:', products);
        
        if (!Array.isArray(products)) {
            console.error('Invalid products data:', products);
            throw new Error('Invalid products data received');
        }
        
        const categorizedProducts = groupByCategory(products);
        displayProducts(categorizedProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        handleProductLoadError();
    } finally {
        hideLoading();
    }
}

// Update other fetch calls similarly
// ...existing code...
