/**
 * WakuWaku Kuku Master - Application Logic
 */

const State = {
    user: {
        name: localStorage.getItem('kuku_username') || '',
    },
    quiz: {
        mode: 'choice', // 'choice' or 'input'
        currentQuestion: 0,
        totalQuestions: 10,
        score: 0,
        questions: [],
        startTime: null,
        timerInterval: null,
    },
    records: JSON.parse(localStorage.getItem('kuku_records')) || []
};

// --- DOM Elements ---
const screens = document.querySelectorAll('.screen');
const loginScreen = document.getElementById('login-screen');
const menuScreen = document.getElementById('menu-screen');
const tableScreen = document.getElementById('table-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const recordsScreen = document.getElementById('records-screen');

const userNameInput = document.getElementById('user-name');
const startBtn = document.getElementById('start-btn');
const welcomeMsg = document.getElementById('welcome-msg');
const multiTable = document.getElementById('multiplication-table');

// --- Initialization ---
function init() {
    // Check if user already exists
    if (State.user.name) {
        userNameInput.value = State.user.name;
    }

    // Set up navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.target;
            const mode = target === 'quiz-choice-screen' ? 'choice' : (target === 'quiz-input-screen' ? 'input' : null);

            if (mode) {
                startQuiz(mode);
            } else {
                showScreen(target);
                if (target === 'table-screen') generateTable();
                if (target === 'records-screen') renderRecords();
            }
        });
    });

    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => showScreen('menu-screen'));
    });

    document.querySelectorAll('.back-to-menu').forEach(btn => {
        btn.addEventListener('click', () => showScreen('menu-screen'));
    });

    startBtn.addEventListener('click', handleStart);

    // Table logic
    const toggleBtn = document.getElementById('toggle-all-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const cells = document.querySelectorAll('.reveal-cell');
            const anyHidden = Array.from(cells).some(c => !c.classList.contains('revealed'));

            cells.forEach(cell => {
                if (anyHidden) {
                    cell.textContent = cell.dataset.answer;
                    cell.classList.add('revealed');
                } else {
                    if (cell.dataset.manual === 'true') {
                        cell.textContent = cell.dataset.answer;
                        cell.classList.add('revealed');
                    } else {
                        cell.textContent = '?';
                        cell.classList.remove('revealed');
                    }
                }
            });
        });
    }

    // Quiz logic
    document.getElementById('submit-answer').addEventListener('click', checkInputAnswer);
    document.getElementById('answer-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkInputAnswer();
    });
}

// --- Navigation ---
function showScreen(id) {
    screens.forEach(s => s.classList.remove('active'));

    // Handle specific screen logic
    if (id === 'quiz-choice-screen' || id === 'quiz-input-screen') {
        quizScreen.classList.add('active');
    } else {
        const target = document.getElementById(id);
        if (target) target.classList.add('active');
    }
}

function handleStart() {
    const name = userNameInput.value.trim();
    if (!name) {
        alert('なまえを いれてね！');
        return;
    }
    State.user.name = name;
    localStorage.setItem('kuku_username', name);
    welcomeMsg.textContent = `こんにちは、${name}さん！`;
    showScreen('menu-screen');
}

// --- Multiplication Table ---
function generateTable() {
    multiTable.innerHTML = '';

    // Header Row
    multiTable.appendChild(createCell('', 'header-cell'));
    for (let i = 1; i <= 10; i++) {
        multiTable.appendChild(createCell(i, 'header-cell'));
    }

    // Body
    for (let r = 1; r <= 10; r++) {
        multiTable.appendChild(createCell(r, 'header-cell'));
        for (let c = 1; c <= 10; c++) {
            const answer = r * c;
            const cell = createCell('?', 'reveal-cell');
            if (r === c) cell.classList.add('diagonal');

            cell.dataset.answer = answer;
            cell.dataset.formula = `${r} × ${c}`;
            cell.dataset.manual = 'false';

            cell.addEventListener('click', () => {
                if (cell.classList.contains('revealed')) {
                    cell.textContent = '?';
                    cell.classList.remove('revealed');
                    cell.dataset.manual = 'false'; // User hidden
                } else {
                    cell.textContent = answer;
                    cell.classList.add('revealed');
                    cell.dataset.manual = 'true'; // User revealed
                    // Add a little pop effect
                    cell.style.animation = 'none';
                    cell.offsetHeight; // trigger reflow
                    cell.style.animation = 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                }
            });

            multiTable.appendChild(cell);
        }
    }
}

function createCell(text, className) {
    const div = document.createElement('div');
    div.className = 'cell ' + (className || '');
    div.textContent = text;
    return div;
}

// --- Quiz Logic ---
function startQuiz(mode) {
    State.quiz.mode = mode;
    State.quiz.currentQuestion = 0;
    State.quiz.score = 0;
    State.quiz.questions = generateQuestions(10);
    State.quiz.startTime = Date.now();

    // UI adjustment
    if (mode === 'choice') {
        document.getElementById('choice-options').classList.remove('hidden');
        document.getElementById('input-option').classList.add('hidden');
    } else {
        document.getElementById('choice-options').classList.add('hidden');
        document.getElementById('input-option').classList.remove('hidden');
    }

    showScreen('quiz-screen');
    updateTimer();
    State.quiz.timerInterval = setInterval(updateTimer, 1000);
    renderQuestion();
}

function generateQuestions(count) {
    const qs = [];
    for (let i = 0; i < count; i++) {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        qs.push({ a, b, answer: a * b });
    }
    return qs;
}

function renderQuestion() {
    const q = State.quiz.questions[State.quiz.currentQuestion];
    document.getElementById('q-formula').textContent = `${q.a} × ${q.b} = ?`;
    document.getElementById('quiz-count').textContent = `だい ${State.quiz.currentQuestion + 1}/${State.quiz.totalQuestions} もん`;

    const progress = ((State.quiz.currentQuestion) / State.quiz.totalQuestions) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;

    if (State.quiz.mode === 'choice') {
        setupChoices(q.answer);
    } else {
        const input = document.getElementById('answer-input');
        input.value = '';
        input.focus();
    }
}

function setupChoices(correct) {
    const options = [correct];
    while (options.length < 4) {
        const rand = (Math.floor(Math.random() * 10) + 1) * (Math.floor(Math.random() * 10) + 1);
        if (!options.includes(rand)) options.push(rand);
    }

    // Shuffle
    options.sort(() => Math.random() - 0.5);

    const container = document.getElementById('choice-options');
    container.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = opt;
        btn.onclick = () => checkChoiceAnswer(opt, correct, btn);
        container.appendChild(btn);
    });
}

function checkChoiceAnswer(selected, correct, btn) {
    const isCorrect = selected === correct;
    if (isCorrect) {
        State.quiz.score++;
        btn.classList.add('correct');
        showFeedback(true);
    } else {
        btn.classList.add('wrong');
        showFeedback(false);
    }

    setTimeout(nextQuestion, 1000);
}

function checkInputAnswer() {
    const input = document.getElementById('answer-input');
    const val = parseInt(input.value);
    const correct = State.quiz.questions[State.quiz.currentQuestion].answer;

    if (isNaN(val)) return;

    if (val === correct) {
        State.quiz.score++;
        showFeedback(true);
    } else {
        showFeedback(false);
    }

    setTimeout(nextQuestion, 1000);
}

function showFeedback(isCorrect) {
    const overlay = document.getElementById('feedback-overlay');
    const emoji = document.getElementById('feedback-emoji');
    const text = document.getElementById('feedback-text');

    overlay.classList.remove('hidden');
    if (isCorrect) {
        emoji.textContent = '🌸';
        text.textContent = 'せいかい！';
        text.style.color = 'var(--success)';
    } else {
        emoji.textContent = '🌵';
        text.textContent = 'おしい！';
        text.style.color = 'var(--primary)';
    }

    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 800);
}

function nextQuestion() {
    State.quiz.currentQuestion++;
    if (State.quiz.currentQuestion < State.quiz.totalQuestions) {
        renderQuestion();
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    clearInterval(State.quiz.timerInterval);
    const endTime = Date.now();
    const duration = Math.floor((endTime - State.quiz.startTime) / 1000);
    const timeStr = formatTime(duration);

    saveRecord(State.quiz.mode, State.quiz.score, timeStr);

    document.getElementById('result-score').textContent = `${State.quiz.score}/${State.quiz.totalQuestions}`;
    document.getElementById('result-time').textContent = timeStr;

    const rewardContainer = document.getElementById('reward-container');
    rewardContainer.innerHTML = '';
    if (State.quiz.score >= 8) {
        document.getElementById('result-title').textContent = 'すごーい！まんてん！';
        const stamp = document.createElement('div');
        stamp.className = 'hanamaru';
        rewardContainer.appendChild(stamp);
        triggerConfetti();
    } else {
        document.getElementById('result-title').textContent = 'よくがんばったね！';
    }

    showScreen('result-screen');
}

// --- Utils ---
function updateTimer() {
    const duration = Math.floor((Date.now() - State.quiz.startTime) / 1000);
    document.getElementById('quiz-timer').textContent = `⏱️ ${formatTime(duration)}`;
}

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function triggerConfetti() {
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D']
    });
}

// --- Records ---
function saveRecord(mode, score, time) {
    const record = {
        date: new Date().toLocaleString('ja-JP'),
        mode: mode === 'choice' ? '4たく' : 'にゅうりょく',
        score: `${score}/10`,
        time: time
    };
    State.records.unshift(record);
    if (State.records.length > 20) State.records.pop();
    localStorage.setItem('kuku_records', JSON.stringify(State.records));
}

function renderRecords() {
    const body = document.getElementById('records-body');
    body.innerHTML = '';

    if (State.records.length === 0) {
        body.innerHTML = '<tr><td colspan="4">まだ きろくが ないよ</td></tr>';
        return;
    }

    State.records.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.date}</td>
            <td>${r.mode}</td>
            <td>${r.score}</td>
            <td>${r.time}</td>
        `;
        body.appendChild(tr);
    });
}

// Boot
window.onload = init;
