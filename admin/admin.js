// Add clear error feedback
function handleInitError(error, message) {
    console.error('Admin initialization error:', error);
    
    // Create an error message that will be shown
    const errorDiv = document.createElement('div');
    errorDiv.className = 'admin-error-message';
    errorDiv.innerHTML = `
        <h2>Error</h2>
        <p>${message || 'Failed to initialize admin panel'}</p>
        <p>${error.message || ''}</p>
        <div class="button-container">
            <button id="backToSite">Return to Main Site</button>
            <button id="debugButton">Debug Token</button>
            <button id="resetToken">Reset Token</button>
        </div>
    `;
    
    // Add to body after clearing it
    document.body.innerHTML = '';
    document.body.appendChild(errorDiv);
    
    // Add button event listeners
    document.getElementById('backToSite').addEventListener('click', () => {
        window.location.href = '/index.html';
    });
    
    document.getElementById('debugButton').addEventListener('click', async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/debug/check-role', {
                headers: {
                    'Authorization': token
                }
            });
            const data = await response.json();
            alert(JSON.stringify(data, null, 2));
        } catch (error) {
            alert(`Debug failed: ${error.message}`);
        }
    });
    
    document.getElementById('resetToken').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        alert('Token and user data cleared. Please login again.');
        window.location.href = '/index.html';
    });
    
    // Remove loading state
    document.body.classList.remove('loading');
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Show loading state
        document.body.classList.add('loading');
        
        // Get token and ensure correct format
        let token = localStorage.getItem('token');
        console.log('Initial token on admin page load:', token);
        
        if (!token) {
            handleInitError(new Error('No token found'), 'Please login to access the admin panel');
            return;
        }
        
        // Ensure token has Bearer prefix
        if (!token.startsWith('Bearer ')) {
            token = `Bearer ${token}`;
            localStorage.setItem('token', token);
            console.log('Updated token format on load:', token);
        }

        // First check user role from localStorage
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            console.log('User from localStorage:', user);
            
            if (user && user.role === 'admin') {
                console.log('User is admin according to localStorage');
                
                // Still verify with server but don't block on it
                verifyAdmin().catch(err => {
                    console.warn('Background admin verification failed:', err);
                });
                
                // Load dashboard immediately
                await loadDashboardData();
                setupRealTimeUpdates();
                setupLogoutHandler();
                
                // Setup header logout button
                const headerLogoutBtn = document.getElementById('header-logout-btn');
                if (headerLogoutBtn) {
                    headerLogoutBtn.addEventListener('click', performLogout);
                }
                
                // Set admin name
                const adminNameElement = document.getElementById('admin-name');
                if (adminNameElement) {
                    adminNameElement.textContent = user.name || 'Admin';
                }
                
                // Remove loading state
                document.body.classList.remove('loading');
                return;
            } else {
                console.log('User is not admin according to localStorage');
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
        }

        // If we get here, we need to verify with the server
        console.log('Verifying admin status with server...');
        const adminVerified = await verifyAdmin();
        console.log('Admin verification result:', adminVerified);
        
        if (!adminVerified) {
            handleInitError(new Error('Admin verification failed'), 'You do not have admin privileges');
            return;
        }
        
        console.log('Admin verified successfully, loading dashboard data');
        await loadDashboardData();
        setupRealTimeUpdates();
        setupLogoutHandler();
        
        // Setup header logout button
        const headerLogoutBtn = document.getElementById('header-logout-btn');
        if (headerLogoutBtn) {
            headerLogoutBtn.addEventListener('click', performLogout);
        }
        
        // Set admin name
        const adminNameElement = document.getElementById('admin-name');
        if (adminNameElement) {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                adminNameElement.textContent = user.name || 'Admin';
            } catch (e) {
                console.error('Error parsing user data:', e);
                adminNameElement.textContent = 'Admin';
            }
        }
        
        // Remove loading state
        document.body.classList.remove('loading');
    } catch (error) {
        handleInitError(error);
    }
});

// In your verifyAdmin function, make sure to handle token formatting properly
async function verifyAdmin() {
    try {
        const token = localStorage.getItem('token');
        console.log('Current token:', token);
        
        if (!token) {
            console.error('No token found');
            return false;
        }
        
        // Ensure token has correct format
        const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        
        // Server verification
        console.log('Verifying admin status with server');
        const response = await fetch('http://localhost:3000/api/verify-admin', {
            headers: {
                'Authorization': formattedToken
            }
        });
        
        console.log('Admin verification status:', response.status, response.statusText);

        if (!response.ok) {
            console.error('Admin verification failed:', await response.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error('Auth error:', error);
        return false;
    }
}

async function refreshToken() {
    try {
        const response = await fetch('http://localhost:3000/api/refresh-token', {
            method: 'POST',
            credentials: 'include' // For cookies
        });
        
        if (!response.ok) {
            console.log('Refresh token response was not OK:', response.status);
            return false;
        }
        
        const data = await response.json();
        
        // Ensure token has Bearer prefix
        const token = data.token.startsWith('Bearer ') ? data.token : `Bearer ${data.token}`;
        console.log('Storing refreshed token:', token);
        localStorage.setItem('token', token);
        
        // Set token expiry time for auto-refresh
        const expiryTime = new Date().getTime() + (data.expiresIn * 1000);
        localStorage.setItem('tokenExpiry', expiryTime);
        
        return true;
    } catch (error) {
        console.error('Token refresh error:', error);
        return false;
    }
}

async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found');
        }

        const response = await fetch('http://localhost:3000/api/dashboard-stats', {
            headers: {
                'Authorization': token
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Reset main content to original dashboard HTML
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <header>
                <div class="header-content">
                    <h1>Dashboard</h1>
                    <div class="admin-profile">
                        <span id="admin-name">Admin</span>
                        <div class="profile-dropdown">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23ccc' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E" 
                             alt="Admin" 
                             id="admin-avatar">
                        <div class="dropdown-content">
                            <a href="#settings"><i class="fas fa-user-cog"></i> Profile</a>
                            <a href="#" id="header-logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
                        </div>
                    </div>
                </div>
            </header>
            
            <div class="dashboard-stats">
                <div class="stat-card">
                    <h3><i class="fas fa-chart-line"></i> Total Sales</h3>
                    <p>₹0</p>
                </div>
                <div class="stat-card">
                    <h3><i class="fas fa-shopping-cart"></i> Total Orders</h3>
                    <p>0</p>
                </div>
                <div class="stat-card">
                    <h3><i class="fas fa-box"></i> Total Products</h3>
                    <p>0</p>
                </div>
                <div class="stat-card">
                    <h3><i class="fas fa-users"></i> Active Users</h3>
                    <p>0</p>
                </div>
            </div>
            
            <div class="recent-activity">
                <h2>Recent Orders</h2>
                <table class="orders-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Product</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Orders will be dynamically loaded here -->
                    </tbody>
                </table>
            </div>
        `;

        // Update the dashboard with data
        updateDashboardStats(data);
        
        // Reattach event listeners
        setupLogoutHandler();
        
        return true;
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Failed to load dashboard data: ' + error.message);
        return false;
    }
}

function redirectToLogin(message) {
    localStorage.setItem('adminMessage', message);
    window.location.href = '/index.html';
}

// Consolidated logout function
async function performLogout() {
    try {
        document.body.classList.add('loading');
        
        try {
            await fetch('http://localhost:3000/api/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout API error:', error);
            // Continue with local logout even if API fails
        } 
        
        // Clear all storage
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiry');
        localStorage.removeItem('user');
        
        // Redirect to home
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error during logout. Please try again.');
        document.body.classList.remove('loading');
    }
}

function setupLogoutHandler() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', performLogout);
    }
}

function updateDashboardUI(data) {
    try {
        console.log('Updating dashboard with data:', data);
        if (!data) {
            showError('No dashboard data available');
            return;
        }
        
        // Set default values if data is missing
        const stats = {
            totalSales: data.totalSales || 0,
            totalOrders: data.totalOrders || 0,
            totalProducts: data.totalProducts || 0,
            activeUsers: data.activeUsers || 0,
            recentOrders: data.recentOrders || []
        };
        
        // Update stats cards
        document.querySelectorAll('.stat-card').forEach(card => {
            const type = card.querySelector('h3').textContent.toLowerCase();
            const value = card.querySelector('p');
            
            if (type.includes('sales')) {
                value.textContent = `₹${stats.totalSales.toLocaleString('en-IN')}`;
            } else if (type.includes('orders')) {
                value.textContent = stats.totalOrders.toLocaleString('en-IN');
            } else if (type.includes('products')) {
                value.textContent = stats.totalProducts.toLocaleString('en-IN');
            } else if (type.includes('users')) {
                value.textContent = stats.activeUsers.toLocaleString('en-IN');
            }
        });

        // Update recent orders table
        const tbody = document.querySelector('.orders-table tbody');
        if (!tbody) return;
        
        if (!stats.recentOrders || stats.recentOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No recent orders available</td></tr>';
            return;
        }
        
        tbody.innerHTML = stats.recentOrders.map(order => `
            <tr>
                <td>#${(order._id && order._id.slice) ? order._id.slice(-5) : 'N/A'}</td>
                <td>${order.customerName || 'Unknown'}</td>
                <td>${order.productName || 'Unknown'}</td>
                <td>₹${(order.amount || 0).toLocaleString('en-IN')}</td>
                <td><span class="status-${(order.status || 'pending').toLowerCase()}">${order.status || 'Pending'}</span></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error updating dashboard UI:', error);
        showError('Error displaying dashboard data');
    }
}

function setupRealTimeUpdates() {
    // Update dashboard every minute
    setInterval(loadDashboardData, 60000);

    // Add navigation handling with error checking
    document.querySelectorAll('.nav-links li').forEach(item => {
        item.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            document.querySelectorAll('.nav-links li').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Get section from href attribute
            const link = this.querySelector('a');
            const section = link.getAttribute('href').substring(1);
            
            // Update header title
            const headerTitle = document.querySelector('.header-content h1');
            if (headerTitle) {
                headerTitle.textContent = link.textContent.trim();
            }
            
            try {
                document.body.classList.add('loading');
                if (section === 'dashboard') {
                    await loadDashboardData();
                } else {
                    await loadSectionData(section);
                }
            } catch (error) {
                console.error(`Error loading section ${section}:`, error);
                showError(`Failed to load ${section} section`);
            } finally {
                document.body.classList.remove('loading');
            }
        });
    });
}

// Consolidate updateDashboardUI and updateSectionUI into a single function
function updateUI(section, data) {
    try {
        console.log(`Updating ${section} UI with data:`, data);
        if (!data) {
            showError(`No ${section} data available`);
            return;
        }

        const mainContent = document.querySelector('.main-content');
        if (!mainContent) {
            throw new Error('Main content container not found');
        }

        // Preserve header
        const header = mainContent.querySelector('header');
        mainContent.innerHTML = '';
        if (header) mainContent.appendChild(header);

        // Create section container
        const sectionContainer = document.createElement('div');
        sectionContainer.className = `section-container ${section}-container`;

        // Handle different section types
        switch(section) {
            case 'dashboard':
                updateDashboardStats(data);
                return;
            case 'products':
                renderProductsSection(sectionContainer, data);
                break;
            case 'users':
                renderUsersSection(sectionContainer, data);
                break;
            case 'orders':
                renderOrdersSection(sectionContainer, data);
                break;
            case 'settings':
                renderSettingsSection(sectionContainer);
                break;
            default:
                sectionContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Unknown section type: ${section}</p>
                    </div>
                `;
        }

        mainContent.appendChild(sectionContainer);
    } catch (error) {
        console.error(`Error updating ${section} UI:`, error);
        showError(`Failed to display ${section} data: ${error.message}`);
    }
}

// Separate dashboard stats update function
function updateDashboardStats(data) {
    const stats = {
        totalSales: data.totalSales || 0,
        totalOrders: data.totalOrders || 0,
        totalProducts: data.totalProducts || 0,
        activeUsers: data.activeUsers || 0,
        recentOrders: data.recentOrders || []
    };

    // Update stats cards
    document.querySelectorAll('.stat-card').forEach(card => {
        const type = card.querySelector('h3').textContent.toLowerCase();
        const value = card.querySelector('p');
        
        if (type.includes('sales')) {
            value.textContent = `₹${stats.totalSales.toLocaleString('en-IN')}`;
        } else if (type.includes('orders')) {
            value.textContent = stats.totalOrders.toLocaleString('en-IN');
        } else if (type.includes('products')) {
            value.textContent = stats.totalProducts.toLocaleString('en-IN');
        } else if (type.includes('users')) {
            value.textContent = stats.activeUsers.toLocaleString('en-IN');
        }
    });

    // Update orders table
    updateOrdersTable(stats.recentOrders);
}

// Separate orders table update function
function updateOrdersTable(orders) {
    const tbody = document.querySelector('.orders-table tbody');
    if (!tbody) return;
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No recent orders available</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>#${(order._id && order._id.slice) ? order._id.slice(-5) : 'N/A'}</td>
            <td>${order.customerName || 'Unknown'}</td>
            <td>${order.productName || 'Unknown'}</td>
            <td>₹${(order.amount || 0).toLocaleString('en-IN')}</td>
            <td><span class="status-${(order.status || 'pending').toLowerCase()}">${order.status || 'Pending'}</span></td>
        </tr>
    `).join('');
}

// Update loadSectionData to use the new updateUI function
async function loadSectionData(section) {
    try {
        document.body.classList.add('loading');
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found');

        const endpoint = getEndpointForSection(section);
        const response = await fetch(endpoint, {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch ${section} data: ${response.statusText}`);
        }

        const data = await response.json();
        updateUI(section, data);
    } catch (error) {
        console.error(`Error loading ${section}:`, error);
        showError(`Failed to load ${section}: ${error.message}`);
    } finally {
        document.body.classList.remove('loading');
    }
}

// Helper function to get endpoint URLs
function getEndpointForSection(section) {
    const baseUrl = 'http://localhost:3000/api';
    switch(section) {
        case 'products': return `${baseUrl}/products`;
        case 'dashboard': return `${baseUrl}/dashboard-stats`;
        case 'users': return `${baseUrl}/admin/users`;
        case 'orders': return `${baseUrl}/admin/orders`;
        default: return `${baseUrl}/admin/${section}`;
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        ${message}
        <button onclick="this.parentElement.remove();" class="close-error">&times;</button>
    `;
    
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(errorDiv, mainContent.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => errorDiv.remove(), 5000);
}

function renderProductsSection(container, products) {
    container.innerHTML = `
        <div class="section-header">
            <h2>Products</h2>
            <button class="add-btn" id="addProductBtn"><i class="fas fa-plus"></i> Add Product</button>
        </div>
        <div class="data-table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr data-product='${JSON.stringify(product)}'>
                            <td>
                                <img src="${product.imageUrl || 'https://via.placeholder.com/50x50?text=Product'}" 
                                     alt="${product.name}"
                                     class="product-thumbnail"
                                     onerror="this.src='https://via.placeholder.com/50x50?text=Product'">
                            </td>
                            <td>${product.name || 'Unnamed Product'}</td>
                            <td>${product.category || 'Uncategorized'}</td>
                            <td>₹${(product.price || 0).toLocaleString('en-IN')}</td>
                            <td>${product.stock || 0}</td>
                            <td>
                                <button class="icon-btn edit-btn" onclick="editProduct('${product._id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="icon-btn delete-btn" onclick="deleteProduct('${product._id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Add Product Modal
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div id="productModal" class="modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2 id="modalTitle">Add Product</h2>
                <form id="productForm">
                    <input type="hidden" id="productId">
                    <div class="form-group">
                        <label for="productName">Name</label>
                        <input type="text" id="productName" required>
                    </div>
                    <div class="form-group">
                        <label for="productCategory">Category</label>
                        <input type="text" id="productCategory" required>
                    </div>
                    <div class="form-group">
                        <label for="productPrice">Price</label>
                        <input type="number" id="productPrice" required>
                    </div>
                    <div class="form-group">
                        <label for="productStock">Stock</label>
                        <input type="number" id="productStock" required>
                    </div>
                    <div class="form-group">
                        <label for="productImage">Image URL</label>
                        <input type="url" id="productImage">
                    </div>
                    <div class="form-group">
                        <label for="productDescription">Description</label>
                        <textarea id="productDescription"></textarea>
                    </div>
                    <button type="submit" class="submit-btn">Save Product</button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Add event listeners
    const addBtn = container.querySelector('#addProductBtn');
    const productModal = document.querySelector('#productModal');
    const closeBtn = productModal.querySelector('.close');
    const productForm = document.querySelector('#productForm');

    addBtn.onclick = () => {
        productModal.style.display = 'block';
        document.querySelector('#modalTitle').textContent = 'Add Product';
        productForm.reset();
    };

    closeBtn.onclick = () => {
        productModal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === productModal) {
            productModal.style.display = 'none';
        }
    };

    productForm.onsubmit = async (e) => {
        e.preventDefault();
        const productId = document.querySelector('#productId').value;
        const productData = {
            name: document.querySelector('#productName').value,
            category: document.querySelector('#productCategory').value,
            price: Number(document.querySelector('#productPrice').value),
            stock: Number(document.querySelector('#productStock').value),
            imageUrl: document.querySelector('#productImage').value,
            description: document.querySelector('#productDescription').value
        };

        try {
            const token = localStorage.getItem('token');
            const url = productId 
                ? `http://localhost:3000/api/products/${productId}`
                : 'http://localhost:3000/api/products';
            
            const response = await fetch(url, {
                method: productId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(productData)
            });

            if (!response.ok) {
                throw new Error('Failed to save product');
            }

            productModal.style.display = 'none';
            showNotification('Product saved successfully');
            loadSectionData('products');
        } catch (error) {
            showError('Error saving product: ' + error.message);
        }
    };
}

// Add these functions to handle edit and delete
window.editProduct = async function(productId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
            headers: {
                'Authorization': token
            }
        });

        if (!response.ok) throw new Error('Failed to fetch product');
        
        const product = await response.json();
        const modal = document.querySelector('#productModal');
        
        // Fill form with product data
        document.querySelector('#modalTitle').textContent = 'Edit Product';
        document.querySelector('#productId').value = product._id;
        document.querySelector('#productName').value = product.name;
        document.querySelector('#productCategory').value = product.category;
        document.querySelector('#productPrice').value = product.price;
        document.querySelector('#productStock').value = product.stock;
        document.querySelector('#productImage').value = product.imageUrl;
        document.querySelector('#productDescription').value = product.description;

        modal.style.display = 'block';
    } catch (error) {
        showError('Error loading product: ' + error.message);
    }
};

window.deleteProduct = async function(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token
            }
        });

        if (!response.ok) throw new Error('Failed to delete product');

        showNotification('Product deleted successfully');
        loadSectionData('products');
    } catch (error) {
        showError('Error deleting product: ' + error.message);
    }
};

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `
        ${message}
        <button class="close-notification">&times;</button>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}

function renderOrdersSection(container, orders) {
    container.innerHTML = `
        <div class="section-header">
            <h2>Orders</h2>
        </div>
        <div class="data-table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Products</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td>#${(order._id && order._id.slice) ? order._id.slice(-5) : 'N/A'}</td>
                            <td>${order.userId?.name || order.customerName || 'Unknown'}</td>
                            <td>${order.productId?.name || order.productName || 'Unknown'}</td>
                            <td>${new Date(order.createdAt || Date.now()).toLocaleDateString()}</td>
                            <td>₹${(order.amount || 0).toLocaleString('en-IN')}</td>
                            <td><span class="status-${(order.status || 'pending').toLowerCase()}">${order.status || 'Pending'}</span></td>
                            <td>
                                <button class="icon-btn view-btn" data-id="${order._id}"><i class="fas fa-eye"></i></button>
                                <button class="icon-btn update-status-btn" data-id="${order._id}"><i class="fas fa-sync"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    // Add event listeners for actions
    container.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const orderId = btn.getAttribute('data-id');
            // TODO: Implement view order details
            console.log(`View order ${orderId}`);
        });
    });
    
    container.querySelectorAll('.update-status-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const orderId = btn.getAttribute('data-id');
            // TODO: Implement status update functionality
            console.log(`Update status for order ${orderId}`);
        });
    });
}

function renderUsersSection(container, users) {
    container.innerHTML = `
        <div class="section-header">
            <h2>Users</h2>
        </div>
        <div class="data-table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.name || 'N/A'}</td>
                            <td>${user.email || 'N/A'}</td>
                            <td>${user.role || 'user'}</td>
                            <td>${new Date(user.createdAt || Date.now()).toLocaleDateString()}</td>
                            <td>
                                <button class="icon-btn view-user-btn" data-id="${user._id}"><i class="fas fa-eye"></i></button>
                                ${user.role !== 'admin' ? 
                                    `<button class="icon-btn make-admin-btn" data-id="${user._id}"><i class="fas fa-user-shield"></i></button>` : 
                                    ''
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    // Add event listeners for actions
    container.querySelectorAll('.view-user-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-id');
            // TODO: Implement view user details
            console.log(`View user ${userId}`);
        });
    });
    
    container.querySelectorAll('.make-admin-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-id');
            // TODO: Implement make admin functionality
            console.log(`Make user ${userId} an admin`);
        });
    });
}

function renderSettingsSection(container) {
    container.innerHTML = `
        <div class="section-header">
            <h2>Settings</h2>
        </div>
        <div class="settings-container">
            <form id="settings-form" class="admin-form">
                <div class="form-group">
                    <h3>Site Settings</h3>
                </div>
                <div class="form-group">
                    <label for="site-name">Site Name</label>
                    <input type="text" id="site-name" value="BuildMart" />
                </div>
                <div class="form-group">
                    <label for="site-description">Site Description</label>
                    <textarea id="site-description">BuildMart Construction Materials Website</textarea>
                </div>
                
                <div class="form-group">
                    <h3>Admin Settings</h3>
                </div>
                <div class="form-group">
                    <label for="admin-name">Admin Name</label>
                    <input type="text" id="admin-name" value="Admin User" />
                </div>
                <div class="form-group">
                    <label for="admin-email">Admin Email</label>
                    <input type="email" id="admin-email" value="admin@buildmart.com" />
                </div>
                <div class="form-group">
                    <label for="admin-password">Change Password</label>
                    <input type="password" id="admin-password" placeholder="New password" />
                </div>
                <div class="form-group">
                    <label for="admin-password-confirm">Confirm Password</label>
                    <input type="password" id="admin-password-confirm" placeholder="Confirm password" />
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="save-btn">Save Settings</button>
                </div>
            </form>
        </div>
    `;
    
    // Add form submit handler
    container.querySelector('#settings-form').addEventListener('submit', function(e) {
        e.preventDefault();
        // TODO: Implement settings save functionality
        console.log('Save settings');
    });
}
