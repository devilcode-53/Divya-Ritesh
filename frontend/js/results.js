// ============================================
// Results Page Script
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

// Color array for bars
const barColors = ['#F5C542', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F97316', '#EF4444', '#06B6D4'];

async function loadResults() {
    try {
        const response = await fetch(`${API_BASE}/results`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await response.json();

        if (!data.success || !data.hasResults) {
            showToast('No results found. Take an assessment first!', 'info');
            setTimeout(() => window.location.href = 'assessment.html', 2000);
            return;
        }

        const results = data.results;
        renderTopResult(results[0]);
        renderScoreChart(results);
        renderOtherResults(results.slice(1));

    } catch (error) {
        showToast('Failed to load results.', 'error');
    }
}

function renderTopResult(result) {
    const container = document.getElementById('topResultContainer');
    container.innerHTML = `
        <div class="glass-card top-result" style="animation: fadeInUp 0.6s ease-out;">
            <div class="top-result-icon">${result.career.icon}</div>
            <h2>${result.career.title}</h2>
            <div class="match-score">${result.score}% Match</div>
            <p>${result.career.description}</p>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <span class="career-demand ${result.career.demandLevel.toLowerCase()}">${result.career.demandLevel} Demand</span>
                <span style="padding: 4px 12px; background: rgba(59, 130, 246, 0.1); border-radius: 50px; font-size: 0.8rem; color: #3B82F6;">${result.career.avgSalary}</span>
                <span style="padding: 4px 12px; background: rgba(139, 92, 246, 0.1); border-radius: 50px; font-size: 0.8rem; color: #8B5CF6;">${result.career.category}</span>
            </div>
            <div class="mt-3">
                <a href="roadmap.html?careerId=${result.career.id}" class="btn btn-primary btn-glow">🗺️ View Career Roadmap</a>
            </div>
        </div>
    `;
}

function renderScoreChart(results) {
    const container = document.getElementById('scoreChart');
    container.innerHTML = results.map((r, i) => `
        <div class="score-row" style="animation: fadeInUp 0.5s ease-out ${i * 0.15}s both;">
            <span class="score-label">${r.career.icon} ${r.career.title}</span>
            <div class="score-bar-bg">
                <div class="score-bar-fill" id="scoreBar${i}" 
                     style="background: ${barColors[i % barColors.length]};">
                    ${r.score}%
                </div>
            </div>
        </div>
    `).join('');

    // Animate bars after a brief delay
    setTimeout(() => {
        results.forEach((r, i) => {
            const bar = document.getElementById(`scoreBar${i}`);
            if (bar) bar.style.width = `${Math.max(r.score, 15)}%`;
        });
    }, 300);
}

function renderOtherResults(results) {
    const container = document.getElementById('otherResults');
    if (results.length === 0) {
        container.innerHTML = '<p style="color: var(--text-gray);">No other matches to display.</p>';
        return;
    }

    container.innerHTML = results.map((r, i) => `
        <div class="glass-card result-card" style="animation: fadeInUp 0.5s ease-out ${i * 0.1}s both; cursor: pointer;"
             onclick="window.location.href='roadmap.html?careerId=${r.career.id}'">
            <div class="result-card-rank" style="background: ${barColors[(i + 1) % barColors.length]}20; color: ${barColors[(i + 1) % barColors.length]};">
                #${r.rank}
            </div>
            <div class="result-card-info">
                <h3>${r.career.icon} ${r.career.title}</h3>
                <p>${r.career.category} • ${r.career.demandLevel} Demand</p>
            </div>
            <div class="result-card-score">${r.score}%</div>
        </div>
    `).join('');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    hideLoader();
    if (!isLoggedIn()) { window.location.href = 'login.html'; return; }
    updateNavAuth();
    loadResults();
});