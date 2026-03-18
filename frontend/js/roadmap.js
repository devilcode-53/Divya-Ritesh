// ============================================
// Roadmap Page Script
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

async function loadRoadmap() {
    const params = new URLSearchParams(window.location.search);
    const careerId = params.get('careerId');

    if (!careerId) {
        showToast('No career selected. Redirecting to results...', 'info');
        setTimeout(() => window.location.href = 'results.html', 1500);
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/roadmap/${careerId}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await response.json();

        if (data.success) {
            renderRoadmap(data);
        } else {
            showToast('Failed to load roadmap.', 'error');
        }
    } catch (error) {
        showToast('Network error.', 'error');
    }
}

function renderRoadmap(data) {
    const { career, roadmap } = data;

    // Career badge
    document.getElementById('careerBadge').innerHTML = `
        ${career.icon} ${career.title}
    `;

    // Timeline
    const container = document.getElementById('timelineContainer');
    container.innerHTML = roadmap.map(step => `
        <div class="timeline-item">
            <div class="timeline-dot">${step.stepNumber}</div>
            <div class="glass-card timeline-card">
                <div class="timeline-card-header">
                    <h3>${step.title}</h3>
                    <span class="timeline-duration">⏱ ${step.duration}</span>
                </div>
                <p>${step.description}</p>
                
                <div class="timeline-section">
                    <h4>🛠 Skills to Learn</h4>
                    <div class="skill-tags">
                        ${step.skills.map(s => `<span class="skill-tag">${s.trim()}</span>`).join('')}
                    </div>
                </div>

                <div class="timeline-section">
                    <h4>📚 Resources</h4>
                    <div class="resource-tags">
                        ${step.resources.map(r => `<span class="resource-tag">${r.trim()}</span>`).join('')}
                    </div>
                </div>

                <div class="timeline-milestone">
                    🎯 <strong>Milestone:</strong> ${step.milestone}
                </div>
            </div>
        </div>
    `).join('');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    hideLoader();
    if (!isLoggedIn()) { window.location.href = 'login.html'; return; }
    updateNavAuth();
    loadRoadmap();
});