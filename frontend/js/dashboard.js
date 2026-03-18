// ============================================
// Dashboard Page Script
// ============================================

const API_BASE = 'http://localhost:5000/api';

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span><button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
}

function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) setTimeout(() => loader.classList.add('hidden'), 300);
}

function getToken() { return localStorage.getItem('token'); }
function getUser() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
function isLoggedIn() { return getToken() !== null; }
function logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = 'login.html'; }

function updateNavAuth() {
    const navAuth = document.getElementById('navAuth');
    if (!navAuth) return;
    if (isLoggedIn()) {
        const user = getUser();
        navAuth.innerHTML = `
            <div class="nav-user-info">
                <div class="nav-avatar" style="background: ${user?.avatar_color || '#F5C542'}">${user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                <button class="btn btn-sm btn-outline" onclick="logout()">Logout</button>
            </div>
        `;
    }
}

const barColors = ['#F5C542', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F97316', '#EF4444', '#06B6D4'];

async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/dashboard/user-progress`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await response.json();

        if (data.success) {
            renderDashboard(data.dashboard);
        } else {
            showToast('Failed to load dashboard.', 'error');
        }
    } catch (error) {
        showToast('Network error.', 'error');
    }
}

function renderDashboard(dashboard) {
    const { user, progress, results, stats } = dashboard;

    // Welcome message
    const hour = new Date().getHours();
    let greeting = 'Good Morning';
    if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
    if (hour >= 17) greeting = 'Good Evening';

    document.getElementById('dashboardWelcome').innerHTML = `
        <h1>${greeting}, ${user.name.split(' ')[0]}! 👋</h1>
        <p>Here's your career discovery progress at a glance.</p>
    `;

    // Stats
    document.getElementById('statAssessments').textContent = progress.totalAssessments;
    document.getElementById('statAnswers').textContent = stats.totalAnswers;
    document.getElementById('statCompletion').textContent = progress.profileCompletion + '%';

    // Animate stat numbers
    animateNumber('statAssessments', progress.totalAssessments);
    animateNumber('statAnswers', stats.totalAnswers);

    // Profile
    const profileInfo = document.getElementById('profileInfo');
    profileInfo.innerHTML = `
        <div class="profile-avatar" style="background: ${user.avatar_color}">
            ${user.name.charAt(0).toUpperCase()}
        </div>
        <div class="profile-details">
            <h3>${user.name}</h3>
            <p>${user.email}</p>
            <p style="font-size: 0.75rem; margin-top: 4px;">Member since ${new Date(stats.memberSince).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
        </div>
    `;

    // Completion ring
    const completion = progress.profileCompletion;
    const circumference = 2 * Math.PI * 50; // r=50
    const offset = circumference - (completion / 100) * circumference;
    const ring = document.getElementById('completionRing');
    document.getElementById('completionPercent').textContent = completion + '%';
    setTimeout(() => { ring.style.strokeDashoffset = offset; }, 300);

    // Bar chart with results
    renderBarChart(results);

    // Recent results list
    renderRecentResults(results);

    // Preferred career card
    if (progress.preferredCareer) {
        const card = document.getElementById('preferredCareerCard');
        card.style.display = 'block';
        document.getElementById('preferredCareerContent').innerHTML = `
            <div class="text-center">
                <div style="font-size: 3rem; margin-bottom: 12px;">${progress.preferredCareer.icon}</div>
                <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 8px;">${progress.preferredCareer.title}</h3>
                <p style="font-size: 0.82rem; color: var(--text-gray); margin-bottom: 16px;">${progress.preferredCareer.category}</p>
                <a href="roadmap.html?careerId=${progress.preferredCareer.id}" class="btn btn-sm btn-primary">View Roadmap →</a>
            </div>
        `;
    }
}

function renderBarChart(results) {
    const chart = document.getElementById('barChart');

    if (!results || results.length === 0) {
        chart.innerHTML = '<p style="color: var(--text-gray); text-align: center; width: 100%; padding: 40px;">Take an assessment to see your chart.</p>';
        return;
    }

    chart.innerHTML = results.map((r, i) => `
        <div class="bar-item">
            <div class="bar" id="dashBar${i}" 
                 style="height: 0px; background: ${r.color || barColors[i % barColors.length]};"
                 title="${r.title}: ${r.score}%">
            </div>
            <span class="bar-label">${r.icon} ${r.title.split(' ')[0]}</span>
        </div>
    `).join('');

    // Animate bars
    setTimeout(() => {
        results.forEach((r, i) => {
            const bar = document.getElementById(`dashBar${i}`);
            if (bar) {
                const height = Math.max(r.score * 1.8, 20);
                bar.style.height = height + 'px';
            }
        });
    }, 500);
}

function renderRecentResults(results) {
    const list = document.getElementById('recentResultsList');

    if (!results || results.length === 0) {
        list.innerHTML = '<p style="color: var(--text-gray); text-align: center; padding: 20px;">Take an assessment to see your career matches.</p>';
        return;
    }

    list.innerHTML = results.slice(0, 5).map((r, i) => `
        <div class="recent-result-item" style="animation: fadeInUp 0.4s ease-out ${i * 0.1}s both; cursor: pointer;"
             onclick="window.location.href='roadmap.html?careerId=${r.career_id || ''}'">
            <span class="recent-result-icon">${r.icon}</span>
            <div class="recent-result-info">
                <h4>${r.title}</h4>
                <p>${r.category} • Rank #${r.rank_position}</p>
            </div>
            <span class="recent-result-score">${r.score}%</span>
        </div>
    `).join('');
}

function animateNumber(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el || target === 0) return;

    let current = 0;
    const increment = Math.ceil(target / 40);
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = current;
    }, 30);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    hideLoader();

    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    updateNavAuth();
    loadDashboard();

    // Logout button
    document.getElementById('logoutDashBtn')?.addEventListener('click', logout);
});