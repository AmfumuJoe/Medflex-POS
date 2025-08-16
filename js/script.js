// User database (in a real system, this would be on the server)
const users = [
    { id: 1, username: "pharmacist", password: "pharma123", name: "Dr. James Banda", role: "Pharmacist", permissions: ["view", "edit", "prescribe", "checkout"] },
    { id: 2, username: "technician", password: "tech123", name: "Mary Phiri", role: "Technician", permissions: ["view", "checkout"] },
    { id: 3, username: "admin", password: "admin123", name: "Admin User", role: "Admin", permissions: ["view", "edit", "prescribe", "checkout", "manage_users"] }
];

// Sample medication data with Malawian Kwacha prices and local images
const medications = [
    { id: 1, name: "Amoxicillin 500mg", price: 12000, category: "Antibiotics", requiresRx: true, stock: 45, image: "images/amoxicillin.jpg" },
    { id: 2, name: "Lisinopril 10mg", price: 8500, category: "Blood Pressure", requiresRx: true, stock: 32, image: "images/lisinopril.jpg" },
    { id: 3, name: "Atorvastatin 20mg", price: 15750, category: "Cholesterol", requiresRx: true, stock: 28, image: "images/atorvastatin.jpg" },
    { id: 4, name: "Ibuprofen 200mg", price: 2500, category: "Pain Relief", requiresRx: false, stock: 120, image: "images/ibuprofen.jpg" },
    { id: 5, name: "Omeprazole 20mg", price: 14250, category: "Acid Reflux", requiresRx: true, stock: 18, image: "images/omeprazole.jpg" },
    { id: 6, name: "Acetaminophen 500mg", price: 1800, category: "Pain Relief", requiresRx: false, stock: 95, image: "images/acetaminophen.jpg" },
    { id: 7, name: "Diphenhydramine 25mg", price: 3500, category: "Allergy", requiresRx: false, stock: 65, image: "images/diphenhydramine.jpg" },
    { id: 8, name: "Fluticasone Nasal Spray", price: 12500, category: "Allergy", requiresRx: false, stock: 42, image: "images/fluticasone.jpg" },
    { id: 9, name: "Metformin 500mg", price: 9500, category: "Diabetes", requiresRx: true, stock: 36, image: "images/metformin.jpg" },
    { id: 10, name: "Albuterol Inhaler", price: 32500, category: "Asthma", requiresRx: true, stock: 22, image: "images/albuterol.jpg" },
    { id: 11, name: "Multivitamin", price: 7500, category: "Supplements", requiresRx: false, stock: 78, image: "images/multivitamin.jpg" },
    { id: 12, name: "Vitamin D3 1000IU", price: 5500, category: "Supplements", requiresRx: false, stock: 84, image: "images/vitamind.jpg" }
];

// Current session variables
let currentUser = null;
let cart = [];
let currentPrescription = null;

// DOM elements
const loginContainer = document.getElementById('login-container');
const posSystem = document.getElementById('pos-system');
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const currentUserElement = document.getElementById('current-user');
const userRoleElement = document.getElementById('user-role');
const logoutBtn = document.getElementById('logout-btn');
const productGrid = document.getElementById('product-grid');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const emptyCartMessage = document.getElementById('empty-cart-message');
const checkoutBtn = document.getElementById('checkout-btn');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const addRxBtn = document.getElementById('add-rx-btn');
const patientNameInput = document.getElementById('patient-name');
const patientDobInput = document.getElementById('patient-dob');
const insuranceProviderInput = document.getElementById('insurance-provider');
const insuranceIdInput = document.getElementById('insurance-id');
const rxNumberInput = document.getElementById('rx-number');
const physicianInput = document.getElementById('physician');
const refillsInput = document.getElementById('refills');

// Format price as MK with comma separators
function formatPrice(price) {
    return `MK${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

// Check if user has permission
function hasPermission(permission) {
    return currentUser?.permissions.includes(permission);
}

// Initialize the application
function init() {
    // Set up event listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Hide POS system until login
    posSystem.style.display = 'none';
    loginContainer.style.display = 'flex';
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    
    const username = usernameInput.value;
    const password = passwordInput.value;
    
    // Find user in database
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Successful login
        currentUser = user;
        startSession();
    } else {
        // Failed login
        errorMessage.style.display = 'block';
    }
}

// Start user session
function startSession() {
    // Hide login, show POS system
    loginContainer.style.display = 'none';
    posSystem.style.display = 'grid';
    
    // Update user info display
    currentUserElement.textContent = currentUser.name;
    userRoleElement.textContent = currentUser.role;
    
    // Initialize POS system
    renderMedications();
    renderCategories();
    updateCart();
    
    // Set up POS event listeners
    checkoutBtn.addEventListener('click', processOrder);
    searchInput.addEventListener('input', filterMedications);
    addRxBtn.addEventListener('click', createPrescription);
    
    // Apply user permissions
    applyPermissions();
}

// Apply user permissions
function applyPermissions() {
    // Example permission checks (extend as needed)
    if (!hasPermission('prescribe')) {
        document.querySelector('.prescription-section').style.display = 'none';
    }
    
    if (!hasPermission('checkout')) {
        checkoutBtn.disabled = true;
        checkoutBtn.title = "You don't have permission to checkout";
    }
}

// Handle logout
function handleLogout() {
    // Clear session
    currentUser = null;
    cart = [];
    currentPrescription = null;
    
    // Reset forms
    loginForm.reset();
    clearPrescriptionForm();
    
    // Show login, hide POS
    posSystem.style.display = 'none';
    loginContainer.style.display = 'flex';
    errorMessage.style.display = 'none';
}

// Render medications
function renderMedications(filteredMeds = medications) {
    productGrid.innerHTML = '';
    
    filteredMeds.forEach(med => {
        const medCard = document.createElement('div');
        medCard.className = 'product-card';
        
        // Stock status class
        let stockStatus = 'in-stock';
        if (med.stock < 10) stockStatus = 'low-stock';
        if (med.stock === 0) stockStatus = 'out-of-stock';
        
        medCard.innerHTML = `
            ${med.requiresRx ? '<div class="rx-badge">RX</div>' : ''}
            <img src="${med.image}" alt="${med.name}">
            <div class="product-name">${med.name}</div>
            <div class="product-details">${med.category}</div>
            <div class="product-price">${formatPrice(med.price)}</div>
            <div class="product-stock ${stockStatus}">
                ${med.stock > 0 ? `${med.stock} in stock` : 'Out of stock'}
            </div>
        `;
        
        medCard.addEventListener('click', () => {
            if (med.stock > 0) {
                addToCart(med);
            } else {
                alert('This medication is currently out of stock');
            }
        });
        productGrid.appendChild(medCard);
    });
}

// Render category filters
function renderCategories() {
    const categories = ['all', ...new Set(medications.map(med => med.category))];
    
    categories.forEach(category => {
        if (category === 'all') return; // Skip "All" since it's already in HTML
        
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.textContent = category;
        btn.dataset.category = category;
        btn.addEventListener('click', filterByCategory);
        categoryFilter.appendChild(btn);
    });
}

// Filter medications by category
function filterByCategory(e) {
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    const category = e.target.dataset.category;
    if (category === 'all') {
        renderMedications();
    } else {
        const filteredMeds = medications.filter(med => med.category === category);
        renderMedications(filteredMeds);
    }
}

// Search/filter medications
function filterMedications() {
    const searchTerm = searchInput.value.toLowerCase();
    const activeCategory = document.querySelector('.category-btn.active').dataset.category;
    
    let filteredMeds = medications;
    
    // Filter by category first
    if (activeCategory !== 'all') {
        filteredMeds = medications.filter(med => med.category === activeCategory);
    }
    
    // Then filter by search term
    filteredMeds = filteredMeds.filter(med => 
        med.name.toLowerCase().includes(searchTerm) || 
        med.category.toLowerCase().includes(searchTerm)
    );
    
    renderMedications(filteredMeds);
}

// Add medication to cart
function addToCart(med) {
    if (med.requiresRx && !currentPrescription) {
        alert('This medication requires a prescription. Please enter prescription information first.');
        return;
    }
    
    const existingItem = cart.find(item => item.id === med.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        const cartItem = {
            ...med,
            quantity: 1
        };
        
        if (med.requiresRx) {
            cartItem.prescription = currentPrescription;
        }
        
        cart.push(cartItem);
    }
    
    updateCart();
}

// Update cart display
function updateCart() {
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        emptyCartMessage.style.display = 'block';
        cartTotal.textContent = 'MK0.00';
        return;
    }
    
    emptyCartMessage.style.display = 'none';
    
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                ${item.requiresRx ? `<div class="cart-item-prescription">RX: ${item.prescription?.rxNumber || 'No RX'}</div>` : ''}
                <div class="cart-item-price">${formatPrice(item.price)}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn minus" data-id="${item.id}">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn plus" data-id="${item.id}">+</button>
                <button class="remove-btn" data-id="${item.id}">×</button>
            </div>
        `;
        
        cartItems.appendChild(cartItem);
    });
    
    // Add event listeners to quantity buttons
    document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
        btn.addEventListener('click', decreaseQuantity);
    });
    
    document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
        btn.addEventListener('click', increaseQuantity);
    });
    
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', removeItem);
    });
    
    cartTotal.textContent = formatPrice(total);
}

// Decrease item quantity
function decreaseQuantity(e) {
    const id = parseInt(e.target.dataset.id);
    const item = cart.find(item => item.id === id);
    
    if (item.quantity > 1) {
        item.quantity -= 1;
    } else {
        cart = cart.filter(item => item.id !== id);
    }
    
    updateCart();
}

// Increase item quantity
function increaseQuantity(e) {
    const id = parseInt(e.target.dataset.id);
    const item = cart.find(item => item.id === id);
    item.quantity += 1;
    updateCart();
}

// Remove item from cart
function removeItem(e) {
    const id = parseInt(e.target.dataset.id);
    cart = cart.filter(item => item.id !== id);
    updateCart();
}

// Create prescription
function createPrescription() {
    if (!patientNameInput.value || !rxNumberInput.value) {
        alert('Please enter at least patient name and prescription number');
        return;
    }
    
    currentPrescription = {
        patientName: patientNameInput.value,
        patientDob: patientDobInput.value,
        insuranceProvider: insuranceProviderInput.value,
        insuranceId: insuranceIdInput.value,
        rxNumber: rxNumberInput.value,
        physician: physicianInput.value,
        refills: refillsInput.value
    };
    
    alert(`Prescription ${rxNumberInput.value} for ${patientNameInput.value} has been added`);
}

// Process order
function processOrder() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // Check if any RX items don't have prescription info
    const rxItemsWithoutPrescription = cart.filter(item => 
        item.requiresRx && !item.prescription
    );
    
    if (rxItemsWithoutPrescription.length > 0) {
        alert('Some prescription medications in your cart are missing prescription information.');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const receipt = generateReceipt();
    
    // In a real pharmacy POS, you would:
    // 1. Save to database
    // 2. Print labels
    // 3. Update inventory
    console.log('Receipt:', receipt);
    alert(`Order processed! Total: ${formatPrice(total)}\n\n${receipt}`);
    
    // Clear cart and prescription
    cart = [];
    currentPrescription = null;
    clearPrescriptionForm();
    updateCart();
}

// Generate receipt
function generateReceipt() {
    let receipt = 'PHARMACY RECEIPT\n';
    receipt += '----------------------------\n';
    receipt += `Date: ${new Date().toLocaleString()}\n`;
    receipt += `Processed by: ${currentUser.name} (${currentUser.role})\n\n`;
    
    // Patient info
    if (currentPrescription) {
        receipt += `Patient: ${currentPrescription.patientName}\n`;
        receipt += `DOB: ${currentPrescription.patientDob || 'N/A'}\n`;
        receipt += `Insurance: ${currentPrescription.insuranceProvider || 'N/A'}\n`;
        receipt += `Member ID: ${currentPrescription.insuranceId || 'N/A'}\n\n`;
    }
    
    // Medications
    receipt += 'Medications:\n';
    cart.forEach(item => {
        receipt += `- ${item.name} x ${item.quantity} - ${formatPrice(item.price * item.quantity)}`;
        if (item.requiresRx) {
            receipt += ` (RX: ${item.prescription.rxNumber})`;
        }
        receipt += '\n';
    });
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    receipt += '\n----------------------------\n';
    receipt += `SUBTOTAL: ${formatPrice(total)}\n`;
    
    // Insurance adjustment (simplified)
    if (currentPrescription?.insuranceProvider) {
        const insuranceAdjustment = total * 0.7; // Assume insurance covers 30%
        receipt += `INSURANCE: -${formatPrice(insuranceAdjustment)}\n`;
        receipt += `PATIENT PAYS: ${formatPrice(total - insuranceAdjustment)}\n`;
    }
    
    receipt += 'Thank you for your business!\n';
    receipt += 'Please consult your pharmacist for usage instructions.';
    
    return receipt;
}

// Clear prescription form
function clearPrescriptionForm() {
    patientNameInput.value = '';
    patientDobInput.value = '';
    insuranceProviderInput.value = '';
    insuranceIdInput.value = '';
    rxNumberInput.value = '';
    physicianInput.value = '';
    refillsInput.value = '0';
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);