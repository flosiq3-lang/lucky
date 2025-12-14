// Authentication System
// Default superadmin credentials
const DEFAULT_SUPERADMIN = {
    username: 'admin',
    password: 'admin123',
    role: 'superadmin',
    credits: Infinity,
    id: 'superadmin-001'
};

// Initialize users storage
function initUsers() {
    if (!localStorage.getItem('users')) {
        const users = {
            [DEFAULT_SUPERADMIN.id]: DEFAULT_SUPERADMIN
        };
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Get all users
function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '{}');
}

// Save users
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// Get current user
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

// Set current user
function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// Login
function login(username, password) {
    const users = getUsers();
    
    // Check superadmin first
    if (username === DEFAULT_SUPERADMIN.username && password === DEFAULT_SUPERADMIN.password) {
        setCurrentUser(DEFAULT_SUPERADMIN);
        return { success: true, user: DEFAULT_SUPERADMIN };
    }
    
    // Check other users
    for (const userId in users) {
        const user = users[userId];
        if (user.username === username && user.password === password) {
            setCurrentUser(user);
            return { success: true, user: user };
        }
    }
    
    return { success: false, message: 'Invalid username or password' };
}

// Initialize on page load
if (document.getElementById('login-form')) {
    initUsers();
    
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');
        
        const result = login(username, password);
        
        if (result.success) {
            window.location.href = 'index.html';
        } else {
            errorMessage.textContent = result.message;
        }
    });
}

// Check if user is logged in (for main page)
if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
    }
}

