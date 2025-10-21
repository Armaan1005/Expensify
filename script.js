// Detect if we're running on the server or locally
function getServerUrl() {
    const currentHost = window.location.host;
    if (currentHost && currentHost.includes('localhost:3000')) {
        // Running on the server
        return '';
    } else {
        // Running locally (file://) or different port
        return 'http://localhost:3000';
    }
}

const SERVER_URL = getServerUrl();
console.log('Global SERVER_URL set to:', SERVER_URL);

// --- Dark Mode Theme Toggle ---
function toggleTheme() {
    const root = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');
    const currentTheme = localStorage.getItem('theme') || 'dark';
    
    if (currentTheme === 'dark') {
        // Switch to light mode
        root.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
        if (themeIcon) {
            themeIcon.setAttribute('data-lucide', 'sun');
        }
        console.log('Switched to light mode');
    } else {
        // Switch to dark mode
        root.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
        if (themeIcon) {
            themeIcon.setAttribute('data-lucide', 'moon');
        }
        console.log('Switched to dark mode');
    }
    
    // Reinitialize Lucide icons to update the icon
    if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons();
    }
}

// Apply saved theme on page load
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const root = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');
    
    if (savedTheme === 'light') {
        root.classList.add('light-mode');
        if (themeIcon) {
            themeIcon.setAttribute('data-lucide', 'sun');
        }
    } else {
        root.classList.remove('light-mode');
        if (themeIcon) {
            themeIcon.setAttribute('data-lucide', 'moon');
        }
    }
    
    console.log('Applied saved theme:', savedTheme);
}

// Make functions globally accessible
window.toggleTheme = toggleTheme;
window.applySavedTheme = applySavedTheme;

// --- Confirmation Modal Utilities ---
let confirmModalRefs = null;

function getConfirmModalRefs() {
    if (!confirmModalRefs) {
        confirmModalRefs = {
            modal: document.getElementById('confirm-modal'),
            message: document.getElementById('confirm-message'),
            accept: document.getElementById('confirm-accept'),
            cancel: document.getElementById('confirm-cancel')
        };
    }
    return confirmModalRefs;
}

function ensureConfirmModalReady() {
    const refs = getConfirmModalRefs();
    if (!refs.modal || !refs.message || !refs.accept || !refs.cancel) {
        console.warn('Confirmation modal elements missing');
        return false;
    }
    if (window.initializeLucideIcons) {
        window.initializeLucideIcons();
    }
    return true;
}

function showCustomConfirmation(message, options = {}) {
    if (!ensureConfirmModalReady()) {
        return Promise.resolve(window.confirm ? window.confirm(message) : false);
    }

    const refs = getConfirmModalRefs();
    
    // Set title
    const titleEl = document.getElementById('confirm-title');
    if (titleEl) {
        titleEl.textContent = options.title || 'Confirm Action';
    }
    
    // Set icon
    const iconEl = document.getElementById('confirm-icon');
    if (iconEl && options.icon) {
        iconEl.setAttribute('data-lucide', options.icon);
        if (options.iconColor) {
            iconEl.style.color = options.iconColor;
        }
        // Reinitialize icon
        if (window.initializeLucideIcons) {
            window.initializeLucideIcons();
        }
    }
    
    // Set message
    refs.message.textContent = message;
    
    // Set button texts
    if (options.acceptText) {
        refs.accept.textContent = options.acceptText;
    } else {
        refs.accept.textContent = 'Confirm';
    }
    
    if (options.cancelText) {
        refs.cancel.textContent = options.cancelText;
    } else {
        refs.cancel.textContent = 'Cancel';
    }
    
    // Set button color
    if (options.acceptColor) {
        refs.accept.style.backgroundColor = options.acceptColor;
    } else {
        refs.accept.style.backgroundColor = 'hsl(0, 80%, 55%)'; // Default red
    }
    
    refs.modal.classList.remove('hidden');

    return new Promise((resolve) => {
        const close = (result) => {
            refs.modal.classList.add('hidden');
            refs.accept.removeEventListener('click', onAccept);
            refs.cancel.removeEventListener('click', onCancel);
            document.removeEventListener('keydown', onKeyDown);
            resolve(result);
        };

        const onAccept = () => close(true);
        const onCancel = () => close(false);
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                close(false);
            }
        };

        refs.accept.addEventListener('click', onAccept);
        refs.cancel.addEventListener('click', onCancel);
        document.addEventListener('keydown', onKeyDown);
    });
}

// BULLETPROOF DELETE FUNCTION - DEFINED AT TOP FOR IMMEDIATE AVAILABILITY
async function deleteExpenseNow(expenseId) {

    const confirmed = await showCustomConfirmation(
        `Are you sure you want to delete expense #${expenseId}? This action cannot be undone.`,
        {
            title: 'Delete Expense?',
            icon: 'trash-2',
            iconColor: 'hsl(0, 80%, 60%)',
            acceptText: 'Delete',
            cancelText: 'Keep Expense',
            acceptColor: 'hsl(0, 80%, 55%)'
        }
    );
    if (!confirmed) {
        return;
    }

    // Build URL using SERVER_URL constant to avoid ambiguity
    const user = getCurrentUser();
    const trackerType = user?.trackerType || 'personal';
    const base = SERVER_URL || '';
    const deleteUrl = `${base}/expense?id=${encodeURIComponent(expenseId)}&tracker_type=${trackerType}`;

    if (typeof showNotification === 'function') {
        showNotification('Deleting expense...', 'info');
    }

    try {
        // Use simple DELETE without Content-Type header to avoid CORS preflight where possible
        const resp = await fetch(deleteUrl, { method: 'DELETE' });

        if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            throw new Error(`Server returned ${resp.status} ${resp.statusText} ${text}`);
        }

        const body = await resp.json().catch(() => null);

        if (typeof showNotification === 'function') {
            showNotification('Expense deleted successfully!', 'success');
        } else {
            alert('Expense deleted successfully!');
        }

        if (typeof fetchExpenses === 'function') {
            fetchExpenses();
        } else {
            window.location.reload();
        }
    } catch (err) {
        console.error('DELETE Error:', err);
        if (typeof showNotification === 'function') {
            showNotification(`Failed to delete expense: ${err.message}`, 'error');
        } else {
            alert(`Failed to delete expense: ${err.message}`);
        }
    }
}

// Make it globally accessible immediately
window.deleteExpenseNow = deleteExpenseNow;

// Approve expense (Company Tracker - Admin only)
async function approveExpense(expenseId) {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        showNotification('Only admins can approve expenses', 'error');
        return;
    }
    
    const confirmed = await showCustomConfirmation(
        `Are you sure you want to approve expense #${expenseId}?`,
        {
            title: 'Approve Expense?',
            icon: 'check-circle',
            iconColor: 'hsl(140, 70%, 60%)',
            acceptText: 'Approve',
            cancelText: 'Cancel',
            acceptColor: 'hsl(140, 60%, 50%)'
        }
    );
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${SERVER_URL}/expense/${expenseId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status: 'approved',
                approved_by: user.username
            })
        });
        
        if (response.ok) {
            showNotification('Expense approved successfully', 'success');
            fetchExpenses();
        } else {
            throw new Error('Failed to approve expense');
        }
    } catch (error) {
        console.error('Error approving expense:', error);
        showNotification('Failed to approve expense', 'error');
    }
}

// Reject expense (Company Tracker - Admin only)
async function rejectExpense(expenseId) {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        showNotification('Only admins can reject expenses', 'error');
        return;
    }
    
    const confirmed = await showCustomConfirmation(
        `Are you sure you want to reject expense #${expenseId}?`,
        {
            title: 'Reject Expense?',
            icon: 'x-circle',
            iconColor: 'hsl(0, 80%, 60%)',
            acceptText: 'Reject',
            cancelText: 'Cancel',
            acceptColor: 'hsl(0, 80%, 55%)'
        }
    );
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${SERVER_URL}/expense/${expenseId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status: 'rejected',
                approved_by: user.username
            })
        });
        
        if (response.ok) {
            showNotification('Expense rejected', 'info');
            fetchExpenses();
        } else {
            throw new Error('Failed to reject expense');
        }
    } catch (error) {
        console.error('Error rejecting expense:', error);
        showNotification('Failed to reject expense', 'error');
    }
}

// Make functions globally accessible
window.approveExpense = approveExpense;
window.rejectExpense = rejectExpense;



window.onload = function() {
    // Apply saved theme first
    applySavedTheme();
    
    fetchExpenses();
    initializeParsing();
    initializeAuth();
    
    // Update UI based on tracker type if user is logged in
    const user = getCurrentUser();
    if (user) {
        console.log('User found on page load:', user);
        updateUIForTrackerType();
    }
    
    // Ensure delete function is available globally
    window.deleteExpenseNow = deleteExpenseNow;
};
// --- User Authentication & Session Management ---
function initializeAuth() {
    const unifiedLoginPage = document.getElementById('unified-login-page');
    const authForm = document.getElementById('auth-form');
    const toggleAuthMode = document.getElementById('toggle-auth-mode');
    const authButtonText = document.getElementById('auth-button-text');
    
    // Tracker and role selection elements
    const btnPersonal = document.getElementById('btn-personal');
    const btnCompany = document.getElementById('btn-company');
    const btnEmployee = document.getElementById('btn-employee');
    const btnAdmin = document.getElementById('btn-admin');
    const roleSelectionSection = document.getElementById('role-selection-section');

    // Check if all required elements exist
    if (!unifiedLoginPage || !authForm || !toggleAuthMode || !authButtonText || 
        !btnPersonal || !btnCompany || !btnEmployee || !btnAdmin || !roleSelectionSection) {
        console.error('Missing required elements for unified login page');
        return;
    }

    let isSignup = false;
    let selectedTrackerType = 'personal';
    let selectedRole = 'personal';

    // Check if user is logged in
    if (!getCurrentUser()) {
        // Show unified login page
        unifiedLoginPage.classList.remove('hidden');
    } else {
        // User is logged in, hide login page
        unifiedLoginPage.classList.add('hidden');
    }

    // Tracker type selection handlers
    btnPersonal.addEventListener('click', () => {
        selectedTrackerType = 'personal';
        selectedRole = 'personal';
        
        // Update button styles
        updateTrackerButtonStyles(btnPersonal, btnCompany);
        
        // Hide role selection for personal
        roleSelectionSection.classList.add('hidden');
        
        // Clear role selection
        btnEmployee.style.borderColor = 'hsl(210, 20%, 35%)';
        btnEmployee.style.boxShadow = 'none';
        btnAdmin.style.borderColor = 'hsl(210, 20%, 35%)';
        btnAdmin.style.boxShadow = 'none';
    });

    btnCompany.addEventListener('click', () => {
        selectedTrackerType = 'company';
        
        // Update button styles
        updateTrackerButtonStyles(btnCompany, btnPersonal);
        
        // Show role selection for company
        roleSelectionSection.classList.remove('hidden');
        
        // Set default role to employee if none selected
        if (selectedRole === 'personal') {
            selectedRole = 'employee';
            updateRoleButtonStyles(btnEmployee, btnAdmin);
        }
    });

    btnEmployee.addEventListener('click', () => {
        selectedRole = 'employee';
        updateRoleButtonStyles(btnEmployee, btnAdmin);
    });

    btnAdmin.addEventListener('click', () => {
        selectedRole = 'admin';
        updateRoleButtonStyles(btnAdmin, btnEmployee);
    });

    toggleAuthMode.addEventListener('click', () => {
        isSignup = !isSignup;
        authButtonText.textContent = isSignup ? 'Sign Up' : 'Login';
        toggleAuthMode.textContent = isSignup ? 'Already have an account? Login' : 'Create one';
    });

    authForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = authForm.elements.username.value.trim();
        const password = authForm.elements.password.value.trim();
        if (!username || !password) {
            showNotification('Please enter username and password', 'warning');
            return;
        }
        
        // Store selections temporarily
        localStorage.setItem('selectedTrackerType', selectedTrackerType);
        localStorage.setItem('selectedRole', selectedRole);
        
        let success = false;
        if (isSignup) {
            success = await signup(username, password);
            if (success) {
                showNotification('Account created! You are now logged in.', 'success');
                unifiedLoginPage.classList.add('hidden');
                updateUserContext();
                fetchExpenses(); // Load expenses after signup
            }
        } else {
            success = await login(username, password);
            if (success) {
                showNotification('Login successful!', 'success');
                unifiedLoginPage.classList.add('hidden');
                updateUserContext();
                fetchExpenses(); // Load expenses after login
            }
        }
    });
}

function updateTrackerButtonStyles(activeBtn, inactiveBtn) {
    activeBtn.style.borderColor = 'hsl(210, 45%, 60%)';
    activeBtn.style.boxShadow = '0 0 20px rgba(100, 150, 200, 0.4)';
    inactiveBtn.style.borderColor = 'hsl(210, 20%, 35%)';
    inactiveBtn.style.boxShadow = 'none';
}

function updateRoleButtonStyles(activeBtn, inactiveBtn) {
    activeBtn.style.borderColor = 'hsl(210, 45%, 60%)';
    activeBtn.style.boxShadow = '0 0 20px rgba(100, 150, 200, 0.4)';
    inactiveBtn.style.borderColor = 'hsl(210, 20%, 35%)';
    inactiveBtn.style.boxShadow = 'none';
}

// --- Password Visibility Toggle ---
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('auth-password-input');
    const eyeIcon = document.getElementById('password-eye-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.setAttribute('data-lucide', 'eye-off');
    } else {
        passwordInput.type = 'password';
        eyeIcon.setAttribute('data-lucide', 'eye');
    }
    
    // Reinitialize Lucide icons to update the icon
    if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons();
    }
}

// Make function globally accessible
window.togglePasswordVisibility = togglePasswordVisibility;

// --- User Management Logic ---
let users = [
    { id: 1, username: "admin", password: "admin123", role: "admin" },
    { id: 2, username: "employee1", password: "password1", role: "employee" }
];
let currentUser = null;

async function login(username, password) {
    const trackerType = localStorage.getItem('selectedTrackerType') || 'personal';
    
    try {
        const response = await fetch(`${SERVER_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, tracker_type: trackerType })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            localStorage.removeItem('selectedTrackerType');
            localStorage.removeItem('selectedRole');
            
            currentUser = {
                username: data.username,
                trackerType: data.tracker_type,
                role: data.role
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUIForTrackerType();
            return true;
        } else {
            // Better error message
            const errorMsg = data.error === 'Invalid username or password' 
                ? 'User not found. Please sign up first!' 
                : (data.error || 'Login failed');
            showNotification(errorMsg, 'error');
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed: ' + error.message, 'error');
        return false;
    }
}

async function signup(username, password) {
    const trackerType = localStorage.getItem('selectedTrackerType') || 'personal';
    const role = localStorage.getItem('selectedRole') || 'personal';
    
    try {
        const response = await fetch(`${SERVER_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username, 
                password, 
                tracker_type: trackerType,
                role: role
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            localStorage.removeItem('selectedTrackerType');
            localStorage.removeItem('selectedRole');
            
            currentUser = {
                username: data.username,
                trackerType: data.tracker_type,
                role: data.role
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUIForTrackerType();
            return true;
        } else {
            showNotification(data.error || 'Signup failed', 'error');
            return false;
        }
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('Signup failed: ' + error.message, 'error');
        return false;
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    // Reset to show welcome screen again
    localStorage.removeItem('hasSeenTrackerSelection');
    showNotification('Logged out successfully.', 'info');
    
    // Instead of reloading, show the welcome screen
    setTimeout(() => {
        location.reload();
    }, 500); // Small delay so notification is visible
}

function getCurrentUser() {
    if (currentUser) return currentUser;
    const stored = localStorage.getItem('currentUser');
    if (stored) {
        currentUser = JSON.parse(stored);
        return currentUser;
    }
    return null;
}

function isAdmin() {
    return getCurrentUser() && getCurrentUser().role === "admin";
}

function isEmployee() {
    return getCurrentUser() && getCurrentUser().role === "employee";
}

// --- User Context UI ---
function updateUserContext() {
    let userBar = document.getElementById('user-bar');
    if (!userBar) {
        userBar = document.createElement('div');
        userBar.id = 'user-bar';
        userBar.className = 'fixed top-0 left-0 w-full bg-black/80 text-white flex items-center justify-between px-6 py-2 z-40';
        document.body.appendChild(userBar);
    }
    const user = getCurrentUser();
    if (user) {
        // Hide role display for personal tracker
        const roleDisplay = user.trackerType === 'personal' ? '' : ` <span class="opacity-70" style="color: white;">(${user.role})</span>`;
        
        userBar.innerHTML = `<div class="flex items-center gap-2 text-white"><i data-lucide="user" class="w-4 h-4" style="color: white;"></i> <span class='font-bold' style="color: white;">${user.username}</span>${roleDisplay}</div>
            <button onclick="logout()" class="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-4 rounded transition-all ml-4">Logout</button>`;
        userBar.style.display = 'flex';
    } else {
        userBar.innerHTML = '';
        userBar.style.display = 'none';
    }
    
    // Reinitialize icons after updating user context
    if (window.initializeLucideIcons) {
        window.initializeLucideIcons();
    }
}

// Show user bar on load if logged in
if (getCurrentUser()) updateUserContext();

// --- Tracker Type Selection Logic (Simplified for unified page) ---
// These functions are kept for backward compatibility but are no longer needed
function showTrackerSelection() {
    // No longer needed with unified page
}

function hideTrackerSelection() {
    // No longer needed with unified page
}

function setTrackerType(type) {
    // No longer needed with unified page - handled in initializeAuth
}

function showRoleSelection() {
    // No longer needed with unified page
}

function hideRoleSelection() {
    // No longer needed with unified page
}

function setRole(role) {
    // No longer needed with unified page - handled in initializeAuth
}

function updateUIForTrackerType() {
    const user = getCurrentUser();
    if (!user) {
        console.log('No user found, skipping UI update');
        return;
    }
    
    const trackerType = user.trackerType || 'personal';
    console.log('Updating UI for tracker type:', trackerType, 'User role:', user.role);
    
    // Find sidebar links by searching for the Approvals text
    const sidebarLinks = document.querySelectorAll('aside nav a');
    let approvalsLink = null;
    
    sidebarLinks.forEach(link => {
        if (link.textContent.includes('Approvals')) {
            approvalsLink = link;
        }
    });
    
    // Get dashboard cards by ID
    const pendingApprovalsCard = document.getElementById('pending-approvals-card');
    const activeUsersCard = document.getElementById('active-users-card');
    const dashboardCardsContainer = document.getElementById('dashboard-cards');
    
    console.log('Found elements:', {
        pendingApprovalsCard: !!pendingApprovalsCard,
        activeUsersCard: !!activeUsersCard,
        dashboardCardsContainer: !!dashboardCardsContainer
    });
    
    // Get money sections
    const moneyCardsSection = document.getElementById('money-cards-section');
    const moneyFeaturesSection = document.getElementById('money-features-section');
    
    // Show/hide features based on tracker type and role
    if (trackerType === 'personal') {
        console.log('Personal tracker mode - hiding company features');
        // Hide company-specific features for personal tracker
        if (approvalsLink) {
            approvalsLink.style.display = 'none';
        }
        if (pendingApprovalsCard) {
            pendingApprovalsCard.style.display = 'none';
        }
        if (activeUsersCard) {
            activeUsersCard.style.display = 'none';
        }
        // Show money cards and features for personal tracker
        if (moneyCardsSection) {
            moneyCardsSection.style.display = 'grid';
        }
        if (moneyFeaturesSection) {
            moneyFeaturesSection.style.display = 'grid';
        }
        // Adjust grid layout for personal mode (only 1 card visible)
        if (dashboardCardsContainer) {
            dashboardCardsContainer.className = 'grid grid-cols-1 gap-6 mb-6';
        }
    } else {
        // Company tracker mode
        const isAdmin = user.role === 'admin';
        
        if (approvalsLink) {
            approvalsLink.style.display = isAdmin ? 'flex' : 'none'; // Only admins see approvals
        }
        if (pendingApprovalsCard) {
            pendingApprovalsCard.style.display = isAdmin ? 'flex' : 'none';
        }
        if (activeUsersCard) {
            activeUsersCard.style.display = isAdmin ? 'flex' : 'none'; // Only admins see user count
        }
        // Hide money cards and features for company tracker
        if (moneyCardsSection) {
            moneyCardsSection.style.display = 'none';
        }
        if (moneyFeaturesSection) {
            moneyFeaturesSection.style.display = 'none';
        }
        // Adjust grid layout based on role
        if (dashboardCardsContainer) {
            if (isAdmin) {
                dashboardCardsContainer.className = 'grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 mt-4'; // 3 cards for admin
            } else {
                dashboardCardsContainer.className = 'grid grid-cols-1 gap-6 mb-6 mt-4'; // 1 card for employee
            }
        }
    }
    
    // Update top bar title based on tracker type
    const topBarTitle = document.querySelector('.fixed.top-0.left-64 .text-xl');
    if (topBarTitle) {
        if (trackerType === 'company') {
            topBarTitle.textContent = 'Company Expense Tracker';
        } else {
            topBarTitle.textContent = 'Personal Expense Tracker';
        }
    }
}

// Check if user needs to select tracker type
function checkTrackerTypeSelection() {
    const user = getCurrentUser();
    if (user) {
        // User is logged in, update UI based on their tracker type
        updateUIForTrackerType();
    }
}

// Allow users to change tracker type (accessible from Profile)
function changeTrackerType() {
    // Show unified login page for changing tracker type
    const unifiedLoginPage = document.getElementById('unified-login-page');
    if (unifiedLoginPage) {
        unifiedLoginPage.classList.remove('hidden');
    }
}

// Initialize parsing functionality
function initializeParsing() {
    const smsBtn = document.getElementById('sms-parse-btn');
    const emailBtn = document.getElementById('email-parse-btn');
    const modal = document.getElementById('parse-modal');
    const modalTitle = document.getElementById('modal-title');
    const closeModal = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const parseInput = document.getElementById('parse-input');
    
    let currentParseType = '';
    
    smsBtn.addEventListener('click', () => openParseModal('SMS'));
    emailBtn.addEventListener('click', () => openParseModal('Email'));
    closeModal.addEventListener('click', closeParseModal);
    cancelBtn.addEventListener('click', closeParseModal);
    analyzeBtn.addEventListener('click', analyzeText);
    
    function openParseModal(type) {
        currentParseType = type;
        modalTitle.textContent = `Parse ${type} Content`;
        parseInput.placeholder = `Paste your ${type.toLowerCase()} content here...`;
        modal.classList.remove('hidden');
        parseInput.focus();
    }
    
    function closeParseModal() {
        modal.classList.add('hidden');
        parseInput.value = '';
    }
    
    function analyzeText() {
        const text = parseInput.value.trim();
        if (!text) {
            showNotification('Please enter some text to analyze.', 'warning');
            return;
        }
        
        const expenses = parseExpenseFromText(text);
        if (expenses.length > 0) {
            expenses.forEach(expense => addParsedExpense(expense));
            showNotification(`Extracted ${expenses.length} expense(s) successfully!`, 'success');
            closeParseModal();
        } else {
            showNotification('No expenses found in the text', 'error');
        }
    }
}

document.getElementById("expense-form").onsubmit = function(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const user = getCurrentUser();
    const trackerType = user?.trackerType || 'personal';
    
    // Convert FormData to regular object
    const data = {
        name: formData.get('name'),
        amount: formData.get('amount'),
        category: formData.get('category'),
        date: formData.get('date'),
        user_id: user?.username,
        tracker_type: trackerType,
        submitted_by: user?.username,
        // For company tracker, expenses need approval (unless submitted by admin)
        // For personal tracker, expenses are auto-approved
        status: (trackerType === 'company' && user?.role !== 'admin') ? 'pending' : 'approved'
    };
    
    console.log('Submitting expense:', data);
    console.log('Server URL:', SERVER_URL);
    
    fetch(`${SERVER_URL}/expense`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
            return response.text().then(text => {
                console.error('Server error response:', text);
                throw new Error(`HTTP error! status: ${response.status} - ${text}`);
            });
        }
        return response.json();
    })
    .then(result => {
        console.log('Success:', result);
        const user = getCurrentUser();
        const trackerType = user?.trackerType || 'personal';
        
        if (trackerType === 'company' && user?.role !== 'admin') {
            showNotification('Expense submitted for approval', 'info');
        } else {
            showNotification('Expense added successfully!', 'success');
        }
        
        form.reset();
        fetchExpenses();
    })
    .catch(error => {
        console.error('Error adding expense:', error);
        showNotification(`Failed to add expense: ${error.message}`, 'error');
    });
};

// Handle Money Received Form Submission

document.getElementById("money-received-form").onsubmit = function(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const user = getCurrentUser();
    
    const data = {
        source: formData.get('source'),
        category: formData.get('category'),
        amount: formData.get('amount'),
        date: formData.get('date'),
        user_id: user?.username
    };
    
    console.log('Submitting money received:', data);
    
    fetch(`${SERVER_URL}/money-received`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
            return response.text().then(text => {
                console.error('Server error response:', text);
                throw new Error(`HTTP error! status: ${response.status} - ${text}`);
            });
        }
        return response.json();
    })
    .then(result => {
        console.log('Success:', result);
        form.reset();
    updateMoneyCards(allExpenses); // Update the cards with new data
    // updateNetExpenseChart will be called after allExpenses is updated in fetchExpenses
        fetchAndDisplayMoneyReceived(); // Update the table
        showNotification('Money received added successfully!', 'success');
    })
    .catch(error => {
        console.error('Error adding money received:', error);
        showNotification(`Failed to add money received: ${error.message}`, 'error');
    });
};

// Fetch and display money received entries in the table
function fetchAndDisplayMoneyReceived() {
    const user = getCurrentUser();
    if (!user) return;
    fetch(`${SERVER_URL}/money-received?username=${encodeURIComponent(user.username)}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch money received');
            return response.json();
        })
        .then(data => {
            displayMoneyReceived(data);
        })
        .catch(error => {
            console.error('Error fetching money received:', error);
            displayMoneyReceived([]);
        });
}

// Render money received table rows
function displayMoneyReceived(entries) {
    const tbody = document.getElementById('money-received-list');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!entries || entries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8" style="color: hsl(210, 10%, 85%); opacity: 0.6;">No money received yet</td></tr>`;
        return;
    }
    entries.forEach((item, idx) => {
        const row = document.createElement('tr');
        row.className = "hover:bg-white/5 transition-all duration-300";
        row.innerHTML = `
            <td class="py-4 px-4 font-medium">${item.source}</td>
            <td class="py-4 px-4">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style="background-color: hsl(210, 10%, 25%); color: hsl(210, 10%, 85%);">
                    <i data-lucide="tag" class="w-4 h-4"></i> <span class="ml-1">${item.category || 'Other'}</span>
                </span>
            </td>
            <td class="py-4 px-4 font-bold" style="color: #10b981;">₹${parseFloat(item.amount).toFixed(2)}</td>
            <td class="py-4 px-4 text-white/80">${formatDate(item.date)}</td>
            <td class="py-4 px-4 text-center">
                <button type="button" onclick="deleteMoneyReceived(${item.id})" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
                    <i data-lucide="trash-2" class="w-4 h-4 inline mr-1"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    // Reinitialize Lucide icons
    setTimeout(() => { if (window.initializeLucideIcons) window.initializeLucideIcons(); }, 50);
}

// Delete money received entry
window.deleteMoneyReceived = function(id) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    fetch(`${SERVER_URL}/money-received?id=${id}`, { method: 'DELETE' })
        .then(response => {
            if (!response.ok) throw new Error('Failed to delete entry');
            fetchAndDisplayMoneyReceived();
            showNotification('Entry deleted!', 'success');
        })
        .catch(error => {
            showNotification('Failed to delete entry', 'error');
        });
};

// Fetch money received on page load
window.addEventListener('DOMContentLoaded', fetchAndDisplayMoneyReceived);

// Update Money Received and Net Expenses cards for personal tracker
function updateMoneyCards(expenses) {
    const user = getCurrentUser();
    if (!user || user.trackerType !== 'personal') {
        return; // Only for personal tracker
    }
    
    // Filter out rejected expenses
    const approvedExpenses = expenses.filter(exp => exp.status !== 'rejected');
    
    // Calculate total expenses
    const totalExpenses = approvedExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    
    // Fetch money received from backend
    fetch(`${SERVER_URL}/money-received?username=${encodeURIComponent(user.username)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(moneyReceived => {
            // Calculate total money received
            const totalMoneyReceived = moneyReceived.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
            
            // Calculate net expenses (total expenses - money received)
            const netExpenses = totalExpenses - totalMoneyReceived;
            
            // Update Income card
            const incomeCard = document.getElementById('card-income');
            if (incomeCard) {
                incomeCard.textContent = `₹${totalMoneyReceived.toFixed(2)}`;
            }

            // Update Net Expense card
            const netExpenseCard = document.getElementById('card-net-expense');
            if (netExpenseCard) {
                netExpenseCard.textContent = `₹${netExpenses.toFixed(2)}`;
            }
        })
        .catch(error => {
            console.error('Error fetching money received:', error);
            // Fallback to zero values if backend fails
            const moneyReceivedCard = document.getElementById('card-money-received');
            const netExpensesCard = document.getElementById('card-net-expenses');
            
            if (moneyReceivedCard) {
                moneyReceivedCard.textContent = '₹0.00';
            }
            if (netExpensesCard) {
                netExpensesCard.textContent = `₹${totalExpenses.toFixed(2)}`;
            }
        });
}

// Update Net Expense Chart
function updateNetExpenseChart(expenses) {
    const ctx = document.getElementById('netExpenseChart');
    if (!ctx) return;

    const user = getCurrentUser();
    if (!user || user.trackerType !== 'personal') {
        return; // Only for personal tracker
    }

    // Fetch money received from backend
    fetch(`${SERVER_URL}/money-received?username=${encodeURIComponent(user.username)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(moneyReceived => {
            // Get last 6 months data
            const monthsData = {};
            const today = new Date();
            // Initialize last 6 months
            for (let i = 5; i >= 0; i--) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthsData[monthKey] = { expenses: 0, received: 0, net: 0 };
            }
            // Aggregate expenses by month (only approved and pending, not rejected)
            expenses.forEach(expense => {
                if (expense.status !== 'rejected') {
                    const date = new Date(expense.date);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    if (monthsData.hasOwnProperty(monthKey)) {
                        monthsData[monthKey].expenses += parseFloat(expense.amount);
                    }
                }
            });
            // Aggregate money received by month
            moneyReceived.forEach(item => {
                const date = new Date(item.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (monthsData.hasOwnProperty(monthKey)) {
                    monthsData[monthKey].received += parseFloat(item.amount);
                }
            });
            // Calculate net expenses for each month
            Object.keys(monthsData).forEach(monthKey => {
                monthsData[monthKey].net = monthsData[monthKey].expenses - monthsData[monthKey].received;
            });
            const labels = Object.keys(monthsData).map(key => {
                const [year, month] = key.split('-');
                const date = new Date(year, month - 1);
                return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            });
            const netData = Object.values(monthsData).map(month => month.net);
            // Debug logging
            console.log('[NetExpenseChart] monthsData:', monthsData);
            console.log('[NetExpenseChart] labels:', labels);
            console.log('[NetExpenseChart] netData:', netData);
            // Destroy existing chart if exists
            if (window.netExpenseChart) {
                window.netExpenseChart.destroy();
            }
            // Create net expense chart as a bar chart
            window.netExpenseChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Net Expenses (Spent - Received)',
                        data: netData,
                        backgroundColor: function(context) {
                            const value = context.parsed.y;
                            return value >= 0 ? 'hsla(0, 84%, 60%, 0.7)' : 'hsla(142, 76%, 36%, 0.7)';
                        },
                        borderColor: function(context) {
                            const value = context.parsed.y;
                            return value >= 0 ? 'hsl(0, 84%, 60%)' : 'hsl(142, 76%, 36%)';
                        },
                        borderWidth: 2,
                        borderRadius: 8,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            labels: {
                                color: 'hsl(210, 10%, 85%)',
                                font: { size: 14 }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'hsl(210, 10%, 18%)',
                            titleColor: 'hsl(210, 45%, 60%)',
                            bodyColor: 'hsl(210, 10%, 85%)',
                            borderColor: 'hsl(210, 10%, 30%)',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed.y;
                                    const sign = value >= 0 ? '+' : '';
                                    return `Net: ${sign}₹${value.toFixed(2)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: { color: 'hsl(210, 10%, 70%)' },
                            grid: { color: 'hsl(210, 10%, 25%)' }
                        },
                        y: {
                            ticks: { 
                                color: 'hsl(210, 10%, 70%)',
                                callback: function(value) {
                                    return '₹' + value;
                                }
                            },
                            grid: { color: 'hsl(210, 10%, 25%)' }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error fetching money received for chart:', error);
            // Show empty chart if backend fails
            if (window.netExpenseChart) {
                window.netExpenseChart.destroy();
            }
        });
}

function fetchExpenses() {
    
    const user = getCurrentUser();
    const trackerType = user?.trackerType || 'personal';
    const username = user?.username || '';
    
    // Build URL with tracker_type and username (for personal filtering)
    let url = `${SERVER_URL}/expense?tracker_type=${trackerType}`;
    if (trackerType === 'personal' && username) {
        url += `&username=${encodeURIComponent(username)}`;
    }
    
    // Fetch from the correct database using tracker_type parameter
    fetch(url)
    .then(res => {
        console.log("Fetch response status:", res.status);
        if (!res.ok) {
            throw new Error("Failed to fetch expenses: " + res.status);
        }
        return res.json();
    })
    .then(data => {
        
        // Filter expenses based on role for company tracker
        let filteredData = data;
        
        if (user && user.trackerType === 'company' && user.role === 'employee') {
            // Employees only see their own expenses
            filteredData = data.filter(exp => exp.user_id === user.username);
        }
        // Company admins see all corporate expenses
        // Personal users already filtered by server using username parameter
        
        displayExpenses(filteredData);
        updateChart(filteredData);
        updatePendingCount(filteredData); // Use filtered data for pending count
        updateActiveUsersCount(); // Update active users count
    })
    .catch(error => {
        console.error("Error fetching expenses:", error);
        
        // Show empty state when server is not available
        displayExpenses([]);
        updateChart([]);
        
        // Show a friendly message about server unavailability
        showNotification('Server unavailable. Make sure to run "npm start" and access via http://localhost:3000', 'error');
    });
}

function updatePendingCount(expenses) {
    const pendingCard = document.getElementById('card-pending-approvals');
    if (pendingCard) {
        const pendingCount = expenses.filter(exp => exp.status === 'pending').length;
        pendingCard.textContent = pendingCount;
    }
}

// Update active users count - shows ONLY company database users
function updateActiveUsersCount() {
    const user = getCurrentUser();
    const trackerType = user?.trackerType || 'personal';
    
    // Only fetch for company tracker
    if (trackerType !== 'company') {
        return;
    }
    
    // Fetch company users count (no tracker_type param needed - always returns company users)
    fetch(`${SERVER_URL}/users/count`)
        .then(res => {
            if (!res.ok) {
                throw new Error("Failed to fetch user count");
            }
            return res.json();
        })
        .then(data => {
            const activeUsersCard = document.getElementById('card-active-users');
            if (activeUsersCard) {
                activeUsersCard.textContent = data.count;
            }
        })
        .catch(error => {
            console.error("Error fetching user count:", error);
        });
}

// Sample expense data for demonstration
function getSampleExpenseData() {
    return [
        {
            id: 1,
            name: "Zomato Food Order",
            amount: 450.50,
            category: "Food",
            date: "2025-09-24"
        },
        {
            id: 2,
            name: "Uber Ride",
            amount: 180.00,
            category: "Transport",
            date: "2025-09-23"
        },
        {
            id: 3,
            name: "Electricity Bill",
            amount: 2200.00,
            category: "Bills",
            date: "2025-09-22"
        },
        {
            id: 4,
            name: "Netflix Subscription",
            amount: 649.00,
            category: "Entertainment",
            date: "2025-09-21"
        },
        {
            id: 5,
            name: "BigBasket Groceries",
            amount: 1250.75,
            category: "Food",
            date: "2025-09-20"
        },
        {
            id: 6,
            name: "Petrol",
            amount: 500.00,
            category: "Transport",
            date: "2025-09-19"
        },
        {
            id: 7,
            name: "Amazon Shopping",
            amount: 890.00,
            category: "Other",
            date: "2025-09-18"
        }
    ];
}

// Enhanced notification system with event registration form styling
function showNotification(message, type = 'info') {
    const messageContainer = document.getElementById('message') || createMessageContainer();
    
    let bgColor, textColor;
    const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'x-octagon' : type === 'warning' ? 'alert-triangle' : 'info';

    if(type === 'success') {
        bgColor = 'hsl(210, 45%, 60%)';
        textColor = 'hsl(210, 10%, 85%)';
    } else if(type === 'error') {
        bgColor = '#ef4444';
        textColor = '#f8fafc';
    } else if(type === 'warning') {
        bgColor = '#f59e0b';
        textColor = '#0f172a';
    } else {
        bgColor = 'hsl(210, 45%, 60%)';
        textColor = 'hsl(210, 10%, 85%)';
    }
    
    messageContainer.innerHTML = `
        <div class="alert-popup flex items-center gap-3 px-4 py-2 rounded-lg shadow-lg animate-float-in" style="background-color: ${bgColor}; color: ${textColor}; pointer-events: auto;">
            <i data-lucide="${iconName}" class="w-5 h-5"></i>
            <span class="flex-1">${message}</span>
            <button onclick="this.parentElement.remove()" class="ml-2 opacity-80 hover:opacity-100">
                ×
            </button>
        </div>
    `;
    
    // Reinitialize icons for notification
    if (window.initializeLucideIcons) {
        window.initializeLucideIcons();
    }

    const alertDiv = messageContainer.querySelector('.alert-popup');

    setTimeout(() => {
        alertDiv.classList.remove('animate-float-in');
        alertDiv.classList.add('animate-float-out');
    }, 5000);

    setTimeout(() => { messageContainer.innerHTML = ''; }, 5300);
}

function createMessageContainer() {
    const container = document.createElement('div');
    container.id = 'message';
    container.className = 'fixed top-10 left-1/2 transform -translate-x-1/2 w-96 z-50 pointer-events-none';
    document.body.appendChild(container);
    return container;
}

// Parse expense from text using AI-like patterns
function parseExpenseFromText(text) {
    const expenses = [];
    const lines = text.split('\n');
    
    // Common expense patterns
    const patterns = [
        /(?:paid|spent|charged|debited|transaction).*?(?:rs\.?|₹)\s*(\d+(?:\.\d{2})?)/gi,
        /(?:rs\.?|₹)\s*(\d+(?:\.\d{2})?).*?(?:at|to|for)\s*([a-zA-Z\s]+)/gi,
        /(\d+(?:\.\d{2})?).*?(?:rupees|rs|₹)/gi
    ];
    
    const categoryKeywords = {
        'Food': ['zomato', 'swiggy', 'restaurant', 'food', 'cafe', 'pizza', 'burger', 'lunch', 'dinner', 'breakfast'],
        'Transport': ['uber', 'ola', 'taxi', 'bus', 'metro', 'petrol', 'diesel', 'fuel', 'transport'],
        'Bills': ['electricity', 'phone', 'internet', 'wifi', 'gas', 'water', 'bill', 'recharge'],
        'Entertainment': ['movie', 'netflix', 'spotify', 'game', 'entertainment', 'concert'],
        'Other': ['shopping', 'amazon', 'flipkart', 'medical', 'pharmacy', 'grocery']
    };
    
    lines.forEach(line => {
        patterns.forEach(pattern => {
            const matches = line.matchAll(pattern);
            for (const match of matches) {
                const amount = parseFloat(match[1]);
                if (amount && amount > 0) {
                    let category = 'Other';
                    let name = match[2] || 'Expense';
                    
                    // Determine category based on keywords
                    const lowerLine = line.toLowerCase();
                    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
                        if (keywords.some(keyword => lowerLine.includes(keyword))) {
                            category = cat;
                            break;
                        }
                    }
                    
                    // Extract merchant name
                    const merchantMatch = line.match(/(?:at|to|from)\s+([A-Z][a-zA-Z\s]+)/i);
                    if (merchantMatch) {
                        name = merchantMatch[1].trim();
                    }
                    
                    expenses.push({
                        name: name.substring(0, 50),
                        amount: amount,
                        category: category,
                        date: new Date().toISOString().split('T')[0]
                    });
                }
            }
        });
    });
    
    return expenses.slice(0, 5); // Limit to 5 expenses
}

// Load sample data manually
function loadSampleData() {
    const sampleData = getSampleExpenseData();
    displayExpenses(sampleData);
    updateChart(sampleData);
    showNotification('Sample data loaded successfully!', 'success');
}

// Add parsed expense to form and submit
function addParsedExpense(expense) {
    console.log('Adding parsed expense:', expense);
    
    fetch(`${SERVER_URL}/expense`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(expense)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        console.log('Parsed expense added:', result);
        fetchExpenses();
    })
    .catch(error => {
        console.error('Error adding parsed expense:', error);
        showNotification('Server unavailable. Please try again later.', 'error');
    });
}

function updateTableHeader() {
    const user = getCurrentUser();
    const trackerType = user?.trackerType || 'personal';
    const thead = document.querySelector('#expense-list').closest('table').querySelector('thead tr');
    
    if (trackerType === 'company') {
        thead.innerHTML = `
            <th class="text-left py-4 px-4 font-semibold">Name</th>
            <th class="text-left py-4 px-4 font-semibold">Amount</th>
            <th class="text-left py-4 px-4 font-semibold">Category</th>
            <th class="text-left py-4 px-4 font-semibold">Date</th>
            <th class="text-left py-4 px-4 font-semibold">Submitted By</th>
            <th class="text-left py-4 px-4 font-semibold">Status</th>
            <th class="text-center py-4 px-4 font-semibold">Action</th>
        `;
    } else {
        thead.innerHTML = `
            <th class="text-left py-4 px-4 font-semibold">Name</th>
            <th class="text-left py-4 px-4 font-semibold">Amount</th>
            <th class="text-left py-4 px-4 font-semibold">Category</th>
            <th class="text-left py-4 px-4 font-semibold">Date</th>
            <th class="text-center py-4 px-4 font-semibold">Action</th>
        `;
    }
}

function displayExpenses(expenses) {
    const tbody = document.getElementById("expense-list");
    tbody.innerHTML = "";
    
    // Update table header based on tracker type
    updateTableHeader();
    
    // Calculate and update total expenses (excluding rejected)
    const approvedExpenses = expenses.filter(exp => exp.status !== 'rejected');
    const total = approvedExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const totalCard = document.getElementById('card-total-expenses');
    if (totalCard) {
        totalCard.textContent = `₹${total.toFixed(2)}`;
    }
    
    if (expenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-8" style="color: hsl(210, 10%, 85%); opacity: 0.6;">
                    <div class="flex justify-center mb-2">
                        <i data-lucide="credit-card" class="w-12 h-12" style="color: hsl(210, 45%, 60%);"></i>
                    </div>
                    <div class="text-lg">No expenses yet</div>
                    <div class="text-sm">Add your first expense above!</div>
                </td>
            </tr>
        `;
        // Reinitialize icons for empty state
        if (window.initializeLucideIcons) {
            window.initializeLucideIcons();
        }
        return;
    }
    
    expenses.forEach((exp, index) => {
        const row = document.createElement("tr");
        row.className = "hover:bg-white/5 transition-all duration-300";
        
        const user = getCurrentUser();
        const trackerType = user?.trackerType || 'personal';
        const isAdmin = user?.role === 'admin';
        const status = exp.status || 'approved';
        
        const categoryIcons = {
            'Food': '<i data-lucide="utensils" class="w-4 h-4"></i>',
            'Transport': '<i data-lucide="car" class="w-4 h-4"></i>', 
            'Bills': '<i data-lucide="zap" class="w-4 h-4"></i>',
            'Entertainment': '<i data-lucide="film" class="w-4 h-4"></i>',
            'Other': '<i data-lucide="package" class="w-4 h-4"></i>'
        };
        
        // Status badge colors and icons
        const statusConfig = {
            'approved': { 
                color: 'background-color: hsl(142, 76%, 36%); color: white;',
                icon: '<i data-lucide="check-circle" class="w-3 h-3"></i>',
                text: 'Approved'
            },
            'pending': { 
                color: 'background-color: hsl(45, 93%, 47%); color: hsl(0, 0%, 10%);',
                icon: '<i data-lucide="clock" class="w-3 h-3"></i>',
                text: 'Pending'
            },
            'rejected': { 
                color: 'background-color: hsl(0, 84%, 60%); color: white;',
                icon: '<i data-lucide="x-circle" class="w-3 h-3"></i>',
                text: 'Rejected'
            }
        };
        
        const statusBadge = statusConfig[status] || statusConfig['approved'];
        
        // Debug the expense data and onclick generation
        console.log(`Generating row for expense ${index + 1}:`, exp);
        
        // Build action buttons based on role and tracker type
        let actionButtons = '';
        
        if (trackerType === 'company' && status === 'pending' && isAdmin) {
            // Admin can approve/reject pending expenses
            actionButtons = `
                <div class="flex gap-2 justify-center">
                    <button type="button" onclick="approveExpense(${exp.id})" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105">
                        <i data-lucide="check" class="w-4 h-4 inline"></i>
                    </button>
                    <button type="button" onclick="rejectExpense(${exp.id})" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105">
                        <i data-lucide="x" class="w-4 h-4 inline"></i>
                    </button>
                </div>
            `;
        } else if (status === 'approved' || (trackerType === 'personal')) {
            // Only show delete button for approved expenses or in personal mode
            actionButtons = `
                <button type="button" onclick="deleteExpenseNow(${exp.id})" class="delete-btn bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
                    <i data-lucide="trash-2" class="w-4 h-4 inline mr-1"></i>
                    Delete
                </button>
            `;
        }
        
        // Build row HTML based on tracker type
        if (trackerType === 'company') {
            const submittedBy = exp.submitted_by || exp.user_id || 'Unknown';
            row.innerHTML = `
                <td class="py-4 px-4 font-medium">${exp.name}</td>
                <td class="py-4 px-4 font-bold" style="color: hsl(210, 45%, 60%);">₹${parseFloat(exp.amount).toFixed(2)}</td>
                <td class="py-4 px-4">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style="background-color: hsl(210, 10%, 25%); color: hsl(210, 10%, 85%);">
                        ${categoryIcons[exp.category] || '<i data-lucide="package" class="w-4 h-4"></i>'} <span class="ml-1">${exp.category}</span>
                    </span>
                </td>
                <td class="py-4 px-4 text-white/80">${formatDate(exp.date)}</td>
                <td class="py-4 px-4">
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style="background-color: hsl(210, 10%, 25%); color: hsl(210, 45%, 70%);">
                        <i data-lucide="user" class="w-3 h-3"></i> <span>${submittedBy}</span>
                    </span>
                </td>
                <td class="py-4 px-4">
                    <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium" style="${statusBadge.color}">
                        ${statusBadge.icon} <span>${statusBadge.text}</span>
                    </span>
                </td>
                <td class="py-4 px-4 text-center">
                    ${actionButtons}
                </td>
            `;
        } else {
            // Personal tracker - simpler view without status column
            row.innerHTML = `
                <td class="py-4 px-4 font-medium">${exp.name}</td>
                <td class="py-4 px-4 font-bold" style="color: hsl(210, 45%, 60%);">₹${parseFloat(exp.amount).toFixed(2)}</td>
                <td class="py-4 px-4">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style="background-color: hsl(210, 10%, 25%); color: hsl(210, 10%, 85%);">
                        ${categoryIcons[exp.category] || '<i data-lucide="package" class="w-4 h-4"></i>'} <span class="ml-1">${exp.category}</span>
                    </span>
                </td>
                <td class="py-4 px-4 text-white/80">${formatDate(exp.date)}</td>
                <td class="py-4 px-4 text-center">
                    ${actionButtons}
                </td>
            `;
        }
        
        tbody.appendChild(row);
        
        // Add stagger animation
        setTimeout(() => {
            row.style.animation = `fadeInUp 0.5s ease-out ${index * 0.1}s both`;
        }, 10);
    });
    
    // Reinitialize Lucide icons after adding all rows
    setTimeout(() => {
        if (window.initializeLucideIcons) {
            window.initializeLucideIcons();
        }
    }, 50);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function updateChart(expenses) {
    const ctx = document.getElementById('chart').getContext('2d');
    
    // Filter out rejected expenses from the chart
    const approvedExpenses = expenses.filter(exp => exp.status !== 'rejected');
    
    if (!approvedExpenses || approvedExpenses.length === 0) {
        // Show empty state
        if (window.expenseChart) window.expenseChart.destroy();
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = '#666';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('No expenses to display', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }
    
    const groups = {};
    approvedExpenses.forEach(exp => {
        groups[exp.category] = (groups[exp.category] || 0) + parseFloat(exp.amount);
    });
    const categories = Object.keys(groups);
    const amounts = Object.values(groups);

    // Destroy previous chart if exists
    if (window.expenseChart) window.expenseChart.destroy();

    // Modern solid color palette with app accent first
    const modernColors = [
        '#54a3fa', // App accent (blue)
        '#8B5CF6', // Purple
        '#EF4444', // Red
        '#F59E0B', // Amber
        '#10B981', // Green
        '#06B6D4', // Cyan
        '#F97316'  // Orange
    ];

    window.expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: modernColors.slice(0, categories.length),
                borderColor: '#333',
                borderWidth: 2,
                hoverBorderWidth: 3,
                hoverBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#ffffff',
                        font: {
                            family: 'Inter',
                            size: 12,
                            weight: '500'
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#666',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ₹${context.parsed.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1000
            }
        }
    });
}

// ========================================
// NEW ADVANCED FEATURES
// ========================================

// Global variables for new charts
let trendChart = null;
let comparisonChart = null;
let allExpenses = []; // Store all expenses for filtering
let currentBudget = localStorage.getItem('monthlyBudget') || 0;

// Update Monthly Trend Chart - Shows last 6 months of spending
function updateTrendChart(expenses) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    // Get last 6 months data
    const monthsData = {};
    const today = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthsData[monthKey] = 0;
    }

    // Aggregate expenses by month (only approved and pending, not rejected)
    expenses.forEach(expense => {
        if (expense.status !== 'rejected') {
            const date = new Date(expense.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthsData.hasOwnProperty(monthKey)) {
                monthsData[monthKey] += parseFloat(expense.amount);
            }
        }
    });

    const labels = Object.keys(monthsData).map(key => {
        const [year, month] = key.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    const data = Object.values(monthsData);

    // Destroy existing chart
    if (trendChart) {
        trendChart.destroy();
    }

    // Create new trend chart
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Spending',
                data: data,
                borderColor: 'hsl(210, 45%, 60%)',
                backgroundColor: 'hsla(210, 45%, 60%, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: 'hsl(210, 45%, 60%)',
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: 'hsl(210, 10%, 85%)',
                        font: { size: 14 }
                    }
                },
                tooltip: {
                    backgroundColor: 'hsl(210, 10%, 18%)',
                    titleColor: 'hsl(210, 45%, 60%)',
                    bodyColor: 'hsl(210, 10%, 85%)',
                    borderColor: 'hsl(210, 10%, 30%)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'Spent: ₹' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: 'hsl(210, 10%, 70%)' },
                    grid: { color: 'hsl(210, 10%, 25%)' }
                },
                y: {
                    ticks: { 
                        color: 'hsl(210, 10%, 70%)',
                        callback: function(value) {
                            return '₹' + value;
                        }
                    },
                    grid: { color: 'hsl(210, 10%, 25%)' }
                }
            }
        }
    });
}

// Update Month Comparison Chart - Current vs Previous month
function updateComparisonChart(expenses) {
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) return;

    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = `${today.getFullYear()}-${String(today.getMonth()).padStart(2, '0')}`;

    let currentMonthTotal = 0;
    let lastMonthTotal = 0;

    expenses.forEach(expense => {
        if (expense.status !== 'rejected') {
            const date = new Date(expense.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (monthKey === currentMonth) {
                currentMonthTotal += parseFloat(expense.amount);
            } else if (monthKey === lastMonth) {
                lastMonthTotal += parseFloat(expense.amount);
            }
        }
    });

    // Destroy existing chart
    if (comparisonChart) {
        comparisonChart.destroy();
    }

    // Create comparison chart
    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Previous Month', 'Current Month'],
            datasets: [{
                label: 'Spending',
                data: [lastMonthTotal, currentMonthTotal],
                backgroundColor: [
                    'hsla(210, 45%, 50%, 0.7)',
                    'hsla(210, 45%, 60%, 0.9)'
                ],
                borderColor: [
                    'hsl(210, 45%, 50%)',
                    'hsl(210, 45%, 60%)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'hsl(210, 10%, 18%)',
                    titleColor: 'hsl(210, 45%, 60%)',
                    bodyColor: 'hsl(210, 10%, 85%)',
                    borderColor: 'hsl(210, 10%, 30%)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const change = currentMonthTotal - lastMonthTotal;
                            const percent = lastMonthTotal > 0 ? ((change / lastMonthTotal) * 100).toFixed(1) : 0;
                            return [
                                'Amount: ₹' + context.parsed.y.toFixed(2),
                                'Change: ' + (change >= 0 ? '+' : '') + '₹' + change.toFixed(2) + ' (' + percent + '%)'
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: 'hsl(210, 10%, 70%)' },
                    grid: { display: false }
                },
                y: {
                    ticks: { 
                        color: 'hsl(210, 10%, 70%)',
                        callback: function(value) {
                            return '₹' + value;
                        }
                    },
                    grid: { color: 'hsl(210, 10%, 25%)' }
                }
            }
        }
    });
}

// Update Top Spending Categories
function updateTopCategories(expenses) {
    const categoryTotals = {};
    let grandTotal = 0;

    expenses.forEach(expense => {
        if (expense.status !== 'rejected') {
            const category = expense.category || 'Other';
            categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(expense.amount);
            grandTotal += parseFloat(expense.amount);
        }
    });

    // Sort and get top 5
    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const container = document.getElementById('topCategories');
    if (!container) return;

    container.innerHTML = sortedCategories.map(([category, amount], index) => {
        const percentage = ((amount / grandTotal) * 100).toFixed(1);
        const colors = [
            'hsl(210, 45%, 60%)',
            'hsl(142, 76%, 36%)',
            'hsl(45, 93%, 47%)',
            'hsl(0, 84%, 60%)',
            'hsl(280, 60%, 60%)'
        ];
        
        return `
            <div class="p-4 rounded-lg" style="background-color: hsl(210, 10%, 15%);">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-bold" style="color: ${colors[index]};">${index + 1}. ${category}</span>
                    <span class="font-bold" style="color: hsl(210, 10%, 85%);">₹${amount.toFixed(2)}</span>
                </div>
                <div class="w-full h-2 rounded-full" style="background-color: hsl(210, 10%, 25%);">
                    <div class="h-full rounded-full transition-all duration-500" style="width: ${percentage}%; background-color: ${colors[index]};"></div>
                </div>
                <div class="text-sm mt-1" style="color: hsl(210, 10%, 70%);">${percentage}% of total spending</div>
            </div>
        `;
    }).join('');
}

// Budget Management Functions
function setBudget() {
    const budgetInput = document.getElementById('budgetInput');
    const budget = parseFloat(budgetInput.value);
    
    if (isNaN(budget) || budget <= 0) {
        alert('Please enter a valid budget amount');
        return;
    }
    
    currentBudget = budget;
    localStorage.setItem('monthlyBudget', budget);
    document.getElementById('budgetLimit').textContent = '₹' + budget.toFixed(2);
    
    // Update budget tracking
    updateBudgetTracking(allExpenses);
    
    alert('Budget set successfully!');
}

function updateBudgetTracking(expenses) {
    if (currentBudget <= 0) return;

    // Get current month expenses
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    let currentMonthSpending = 0;
    expenses.forEach(expense => {
        if (expense.status !== 'rejected') {
            const date = new Date(expense.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (monthKey === currentMonth) {
                currentMonthSpending += parseFloat(expense.amount);
            }
        }
    });

    const percentage = Math.min((currentMonthSpending / currentBudget) * 100, 100);
    const remaining = currentBudget - currentMonthSpending;

    // Update UI
    document.getElementById('budgetLimit').textContent = '₹' + currentBudget.toFixed(2);
    document.getElementById('budgetPercentage').textContent = percentage.toFixed(1) + '%';
    document.getElementById('budgetBar').style.width = percentage + '%';
    document.getElementById('budgetRemaining').textContent = '₹' + Math.max(remaining, 0).toFixed(2);
    
    // Change remaining color based on status
    const remainingEl = document.getElementById('budgetRemaining');
    if (remaining < 0) {
        remainingEl.style.color = 'hsl(0, 84%, 60%)';
        document.getElementById('budgetAlert').classList.remove('hidden');
    } else if (percentage > 80) {
        remainingEl.style.color = 'hsl(45, 93%, 47%)';
        document.getElementById('budgetAlert').classList.add('hidden');
    } else {
        remainingEl.style.color = 'hsl(142, 76%, 36%)';
        document.getElementById('budgetAlert').classList.add('hidden');
    }
}

// Search and Filter Functions
function filterExpenses() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('filterCategory').value;
    const fromDate = document.getElementById('filterFromDate').value;
    const toDate = document.getElementById('filterToDate').value;

    let filtered = allExpenses.filter(expense => {
        // Search in description
        const matchesSearch = !searchTerm || 
            expense.description.toLowerCase().includes(searchTerm) ||
            expense.category.toLowerCase().includes(searchTerm);
        
        // Category filter
        const matchesCategory = !category || expense.category === category;
        
        // Date filters
        const expenseDate = new Date(expense.date);
        const matchesFromDate = !fromDate || expenseDate >= new Date(fromDate);
        const matchesToDate = !toDate || expenseDate <= new Date(toDate);
        
        return matchesSearch && matchesCategory && matchesFromDate && matchesToDate;
    });

    displayExpenses(filtered);
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterFromDate').value = '';
    document.getElementById('filterToDate').value = '';
    
    displayExpenses(allExpenses);
}

// Export Functions
function exportToCSV() {
    if (allExpenses.length === 0) {
        alert('No expenses to export');
        return;
    }

    let csv = 'Date,Description,Category,Amount,Status\n';
    
    allExpenses.forEach(expense => {
        csv += `${expense.date},"${expense.description}",${expense.category},${expense.amount},${expense.status}\n`;
    });

    // Create download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function exportToPDF() {
    alert('PDF Export: This feature requires jsPDF library. For now, please use CSV export or print this page using browser\'s print function (Ctrl+P).');
    // To implement PDF export, add jsPDF library to index.html:
    // <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
}

// Update the original fetchExpenses function to populate allExpenses and call new charts
// Store original fetchExpenses and wrap it
const originalFetchExpenses = fetchExpenses;
fetchExpenses = function() {
    originalFetchExpenses();
    
    // Wait a bit for expenses to load, then update advanced features
    setTimeout(() => {
        const user = getCurrentUser();
        if (!user) return;
        
        const trackerType = user.trackerType || 'personal';
        
        let url = `${SERVER_URL}/expense?tracker_type=${trackerType}`;
        if (trackerType === 'personal' && user?.username) {
            url += `&username=${encodeURIComponent(user.username)}`;
        }
        fetch(url)
            .then(res => res.json())
            .then(data => {
                allExpenses = data;
                
                // Update all new charts
                updateTrendChart(data);
                updateComparisonChart(data);
                updateTopCategories(data);
                updateBudgetTracking(data);
                updateMoneyCards(data); // Update money cards
                updateNetExpenseChart(data); // Update net expense chart
            })
            .catch(error => console.error("Error loading expenses for advanced features:", error));
    }, 500);
}

// Initialize budget on page load
if (currentBudget > 0) {
    document.getElementById('budgetLimit').textContent = '₹' + parseFloat(currentBudget).toFixed(2);
}
