// ============================================
// Assessment Page Script
// ============================================

const API_BASE = 'http://localhost:5000/api';

let questions = [];
let currentQuestion = 0;
let userAnswers = {}; // { questionId: 'a'/'b'/'c'/'d' }

// ========== UTILITIES ==========
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `
        <span>${icons[type]}</span>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) setTimeout(() => loader.classList.add('hidden'), 300);
}

function getToken() { return localStorage.getItem('token'); }
function getUser() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
function isLoggedIn() { return getToken() !== null; }
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// ========== NAV ==========
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
    } else {
        window.location.href = 'login.html';
    }
}

// ========== LOAD QUESTIONS ==========
async function loadQuestions() {
    try {
        const response = await fetch(`${API_BASE}/assessment/questions`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await response.json();

        if (data.success) {
            questions = data.questions;
            renderQuestion();
        } else {
            showToast('Failed to load questions.', 'error');
            if (data.message?.includes('token')) {
                setTimeout(() => window.location.href = 'login.html', 1000);
            }
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    }
}

// ========== RENDER QUESTION ==========
function renderQuestion() {
    const container = document.getElementById('questionContainer');
    const q = questions[currentQuestion];

    if (!q) return;

    const options = [
        { key: 'a', text: q.option_a },
        { key: 'b', text: q.option_b },
        { key: 'c', text: q.option_c },
        { key: 'd', text: q.option_d }
    ];

    const selectedAnswer = userAnswers[q.id];

    container.innerHTML = `
        <div class="glass-card question-card" style="animation: fadeInUp 0.4s ease-out;">
            <span class="question-category">${q.category}</span>
            <h2 class="question-text">${q.question}</h2>
            <div class="options-list">
                ${options.map(opt => `
                    <div class="option-item ${selectedAnswer === opt.key ? 'selected' : ''}"
                         onclick="selectOption('${q.id}', '${opt.key}')">
                        <div class="option-radio"></div>
                        <span class="option-label">
                            <span class="option-key">${opt.key.toUpperCase()}</span>
                            ${opt.text}
                        </span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    updateProgress();
    updateNavButtons();
}

// ========== SELECT OPTION ==========
function selectOption(questionId, key) {
    userAnswers[questionId] = key;
    renderQuestion(); // Re-render to show selection
}

// ========== UPDATE PROGRESS ==========
function updateProgress() {
    const total = questions.length;
    const current = currentQuestion + 1;
    const percent = Math.round((current / total) * 100);

    document.getElementById('progressText').textContent = `Question ${current} of ${total}`;
    document.getElementById('progressPercent').textContent = `${percent}%`;
    document.getElementById('progressFill').style.width = `${percent}%`;
}

// ========== UPDATE NAVIGATION BUTTONS ==========
function updateNavButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const total = questions.length;

    prevBtn.style.visibility = currentQuestion === 0 ? 'hidden' : 'visible';

    if (currentQuestion === total - 1) {
        nextBtn.textContent = '✨ Submit Assessment';
        nextBtn.className = 'btn btn-primary btn-glow';
    } else {
        nextBtn.textContent = 'Next →';
        nextBtn.className = 'btn btn-primary';
    }
}

// ========== NAVIGATION ==========
function goNext() {
    const q = questions[currentQuestion];
    if (!userAnswers[q.id]) {
        showToast('Please select an answer before proceeding.', 'info');
        return;
    }

    if (currentQuestion === questions.length - 1) {
        submitAssessment();
    } else {
        currentQuestion++;
        renderQuestion();
    }
}

function goPrev() {
    if (currentQuestion > 0) {
        currentQuestion--;
        renderQuestion();
    }
}

// ========== SUBMIT ASSESSMENT ==========
async function submitAssessment() {
    const answered = Object.keys(userAnswers).length;
    if (answered < questions.length) {
        showToast(`Please answer all questions. (${answered}/${questions.length} answered)`, 'info');
        return;
    }

    const nextBtn = document.getElementById('nextBtn');
    nextBtn.textContent = 'Analyzing...';
    nextBtn.disabled = true;

    // Format answers for API
    const answersArray = Object.entries(userAnswers).map(([questionId, selectedOption]) => ({
        questionId: parseInt(questionId),
        selectedOption
    }));

    try {
        const response = await fetch(`${API_BASE}/assessment/submit-test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ answers: answersArray })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Assessment completed! Redirecting to results...', 'success');
            setTimeout(() => window.location.href = 'results.html', 1500);
        } else {
            showToast(data.message || 'Submission failed.', 'error');
            nextBtn.textContent = '✨ Submit Assessment';
            nextBtn.disabled = false;
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        nextBtn.textContent = '✨ Submit Assessment';
        nextBtn.disabled = false;
    }
}

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
    hideLoader();

    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    updateNavAuth();
    loadQuestions();

    document.getElementById('nextBtn').addEventListener('click', goNext);
    document.getElementById('prevBtn').addEventListener('click', goPrev);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'Enter') goNext();
        if (e.key === 'ArrowLeft') goPrev();
        if (['a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
            const q = questions[currentQuestion];
            if (q) selectOption(q.id.toString(), e.key.toLowerCase());
        }
    });
});