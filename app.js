// Estado da aplicação
let isRunning = false;
let startTime = null;
let sessionSeconds = 0;
let todaySeconds = 0;
let timerInterval = null;
let exchangeRate = 5.80;
let activities = [];
let goalReached = false;

// Elementos do DOM
const timerDisplay = document.getElementById('timerDisplay');
const timerButton = document.getElementById('timerButton');
const buttonText = document.getElementById('buttonText');
const hourlyRateInput = document.getElementById('hourlyRate');
const dailyGoalInput = document.getElementById('dailyGoal');

const sessionEarningsUSD = document.getElementById('sessionEarningsUSD');
const sessionEarningsBRL = document.getElementById('sessionEarningsBRL');
const todayEarningsUSD = document.getElementById('todayEarningsUSD');
const todayEarningsBRL = document.getElementById('todayEarningsBRL');

const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const exchangeRateDisplay = document.getElementById('exchangeRate');
const activityLog = document.getElementById('activityLog');

const clearSessionBtn = document.getElementById('clearSessionBtn');
const finalizeDayBtn = document.getElementById('finalizeDayBtn');
const confettiCanvas = document.getElementById('confettiCanvas');

// 🔊 SOM DE CAIXA REGISTRADORA
function playCashRegisterSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // "Cha-ching!" sound
    const playNote = (frequency, startTime, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    
    // "Cha" part
    playNote(800, now, 0.1);
    playNote(1000, now + 0.05, 0.1);
    
    // "Ching!" part
    playNote(1200, now + 0.15, 0.2);
    playNote(1600, now + 0.18, 0.3);
    
    // Bell overtone
    playNote(2000, now + 0.2, 0.4);
}

// 🎊 CONFETTI ANIMATION
function launchConfetti() {
    const canvas = confettiCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const pieces = [];
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    
    for (let i = 0; i < 100; i++) {
        pieces.push({
            x: Math.random() * canvas.width,
            y: -20,
            width: Math.random() * 10 + 5,
            height: Math.random() * 15 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            velocityY: Math.random() * 3 + 2,
            velocityX: Math.random() * 4 - 2,
            rotationSpeed: Math.random() * 10 - 5
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let stillAnimating = false;
        
        pieces.forEach(piece => {
            piece.y += piece.velocityY;
            piece.x += piece.velocityX;
            piece.rotation += piece.rotationSpeed;
            piece.velocityY += 0.1; // Gravity
            
            if (piece.y < canvas.height + 20) {
                stillAnimating = true;
            }
            
            ctx.save();
            ctx.translate(piece.x, piece.y);
            ctx.rotate((piece.rotation * Math.PI) / 180);
            ctx.fillStyle = piece.color;
            ctx.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
            ctx.restore();
        });
        
        if (stillAnimating) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    animate();
}

// 🎯 VERIFICAR META ATINGIDA
function checkGoalReached() {
    const today = calculateEarnings(todaySeconds);
    const dailyGoal = parseFloat(dailyGoalInput.value);
    
    if (!goalReached && today.usd >= dailyGoal) {
        goalReached = true;
        
        // Tocar som
        playCashRegisterSound();
        
        // Lançar confetti
        launchConfetti();
        
        // Adicionar animação
        document.querySelector('.progress-card').classList.add('goal-achieved');
        progressFill.classList.add('goal-reached');
        
        // Adicionar atividade
        addActivity('goal', `🎉 META ATINGIDA! $${dailyGoal.toFixed(2)}`);
        
        // Vibração no celular (se disponível)
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
        
        setTimeout(() => {
            document.querySelector('.progress-card').classList.remove('goal-achieved');
        }, 600);
    }
}


// 🔔 Som de notificação suave (para pausas)
function playPauseSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;
    
    // Tom descendente suave
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(600, now);
    oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    oscillator.start(now);
    oscillator.stop(now + 0.2);
}

// ▶️ Som de início (bip positivo)
function playStartSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;
    
    // Dois bips rápidos ascendentes
    [400, 600].forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        
        const startTime = now + (i * 0.1);
        gainNode.gain.setValueAtTime(0.15, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.08);
    });
}


// 🗑️ LIMPAR SESSÃO
function clearSession() {
    showConfirmModal(
        '🗑️ Limpar Sessão?',
        'Isso vai zerar o timer atual, mas manterá o total do dia.',
        () => {
            if (isRunning) {
                toggleTimer(); // Pausa se estiver rodando
            }
            
            sessionSeconds = 0;
            updateDisplay();
            updateEarnings();
            
            addActivity('clear', 'Sessão limpa');
        }
    );
}

// ✅ FINALIZAR DIA
function finalizeDay() {
    const today = calculateEarnings(todaySeconds);
    
    showConfirmModal(
        '✅ Finalizar Dia?',
        `Você fez $${today.usd.toFixed(2)} (${formatBRL(today.brlNet)}) hoje. Isso vai resetar tudo para amanhã.`,
        () => {
            if (isRunning) {
                toggleTimer();
            }
            
            // Salvar histórico (para futuras features)
            const history = JSON.parse(localStorage.getItem('history') || '[]');
            history.push({
                date: new Date().toLocaleDateString('pt-BR'),
                usd: today.usd,
                brl: today.brlNet,
                hours: (todaySeconds / 3600).toFixed(2)
            });
            localStorage.setItem('history', JSON.stringify(history));
            
            // Resetar tudo
            sessionSeconds = 0;
            todaySeconds = 0;
            activities = [];
            goalReached = false;
            
            updateDisplay();
            updateEarnings();
            saveTodayData();
            saveActivities();
            renderActivities();
            
            progressFill.classList.remove('goal-reached');
            
            showSuccessMessage('🎉 Dia finalizado com sucesso! Bom descanso!');
        }
    );
}

// 📢 MODAL DE CONFIRMAÇÃO
function showConfirmModal(title, message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>${title}</h2>
            <p>${message}</p>
            <div class="modal-buttons">
                <button class="modal-btn cancel">Cancelar</button>
                <button class="modal-btn confirm">Confirmar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.cancel').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.querySelector('.confirm').addEventListener('click', () => {
        onConfirm();
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// ✅ MENSAGEM DE SUCESSO
function showSuccessMessage(message) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>${message}</h2>
            <div class="modal-buttons">
                <button class="modal-btn confirm">OK</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.confirm').addEventListener('click', () => {
        modal.remove();
    });
    
    setTimeout(() => modal.remove(), 3000);
}

// Buscar cotação do dólar
async function fetchExchangeRate() {
    try {
        const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
        const data = await response.json();
        exchangeRate = parseFloat(data.USDBRL.bid);
        exchangeRateDisplay.textContent = `💱 USD/BRL: R$ ${exchangeRate.toFixed(2)}`;
        updateEarnings();
    } catch (error) {
        console.error('Erro ao buscar cotação:', error);
        exchangeRateDisplay.textContent = `💱 USD/BRL: R$ ${exchangeRate.toFixed(2)} (cache)`;
    }
}

// Inicializar
function init() {
    loadSettings();
    loadTodayData();
    loadActivities();
    updateDisplay();
    updateEarnings();
    fetchExchangeRate();
    
    setInterval(fetchExchangeRate, 5 * 60 * 1000);
}

// Salvar/Carregar configurações
function saveSettings() {
    localStorage.setItem('hourlyRate', hourlyRateInput.value);
    localStorage.setItem('dailyGoal', dailyGoalInput.value);
    goalReached = false; // Reset quando mudar meta
    updateEarnings();
}

function loadSettings() {
    const savedRate = localStorage.getItem('hourlyRate');
    const savedGoal = localStorage.getItem('dailyGoal');
    
    if (savedRate) hourlyRateInput.value = savedRate;
    if (savedGoal) dailyGoalInput.value = savedGoal;
}

// Salvar/Carregar dados do dia
function saveTodayData() {
    const today = new Date().toDateString();
    localStorage.setItem('lastDate', today);
    localStorage.setItem('todaySeconds', todaySeconds);
}

function loadTodayData() {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('lastDate');
    
    if (lastDate === today) {
        todaySeconds = parseInt(localStorage.getItem('todaySeconds')) || 0;
    } else {
        todaySeconds = 0;
        activities = [];
        goalReached = false;
        saveTodayData();
        saveActivities();
    }
}

// Atividades
function addActivity(type, description) {
    const now = new Date();
    const activity = {
        type,
        time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        description
    };
    activities.unshift(activity);
    saveActivities();
    renderActivities();
}

function saveActivities() {
    const today = new Date().toDateString();
    localStorage.setItem('activities_' + today, JSON.stringify(activities));
}

function loadActivities() {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('activities_' + today);
    activities = saved ? JSON.parse(saved) : [];
    renderActivities();
}

function renderActivities() {
    if (activities.length === 0) {
        activityLog.innerHTML = '<div class="activity-empty">Inicie o timer para registrar atividades</div>';
        return;
    }
    
    const icons = {
        start: '▶️',
        pause: '⏸️',
        resume: '▶️',
        clear: '🗑️',
        goal: '🎉'
    };
    
    activityLog.innerHTML = activities.map(activity => `
        <div class="activity-item ${activity.type}">
            <span class="activity-icon">${icons[activity.type] || '📝'}</span>
            <span class="activity-time">${activity.time}</span>
            <span class="activity-description">${activity.description}</span>
        </div>
    `).join('');
}

// Formatar tempo
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Calcular ganhos
function calculateEarnings(seconds) {
    const hours = seconds / 3600;
    const rate = parseFloat(hourlyRateInput.value);
    const usd = hours * rate;
    const brlGross = usd * exchangeRate;
    const brlNet = brlGross * (1 - 0.036);
    
    return { usd, brlNet };
}

// Formatar moeda BRL
function formatBRL(value) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// Atualizar display do timer
function updateDisplay() {
    timerDisplay.textContent = formatTime(sessionSeconds);
}

// Atualizar ganhos e progresso
function updateEarnings() {
    const session = calculateEarnings(sessionSeconds);
    const today = calculateEarnings(todaySeconds);
    const dailyGoal = parseFloat(dailyGoalInput.value);
    
    sessionEarningsUSD.textContent = `$${session.usd.toFixed(2)}`;
    sessionEarningsBRL.textContent = formatBRL(session.brlNet);
    
    todayEarningsUSD.textContent = `$${today.usd.toFixed(2)}`;
    todayEarningsBRL.textContent = formatBRL(today.brlNet);
    
    const progress = Math.min((today.usd / dailyGoal) * 100, 100);
    progressFill.style.width = `${progress}%`;
    progressPercent.textContent = `${Math.round(progress)}%`;
}

// Iniciar/Pausar timer
function toggleTimer() {
    if (!isRunning) {
        const action = sessionSeconds === 0 ? 'start' : 'resume';
        const description = sessionSeconds === 0 ? 'Sessão iniciada' : 'Sessão retomada';
        
        startTime = Date.now() - (sessionSeconds * 1000);
        isRunning = true;
        buttonText.textContent = 'Pausar';
        timerButton.classList.add('active');
        
        addActivity(action, description);
        
        timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            sessionSeconds = elapsed;
            todaySeconds++;
            
            updateDisplay();
            updateEarnings();
            checkGoalReached(); // Verificar meta
            saveTodayData();
        }, 1000);
    } else {
        clearInterval(timerInterval);
        isRunning = false;
        buttonText.textContent = 'Continuar';
        timerButton.classList.remove('active');
        
        const duration = formatTime(sessionSeconds);
        addActivity('pause', `Pausado em ${duration}`);
    }
}

// Event Listeners
timerButton.addEventListener('click', toggleTimer);
hourlyRateInput.addEventListener('change', saveSettings);
dailyGoalInput.addEventListener('change', saveSettings);
clearSessionBtn.addEventListener('click', clearSession);
finalizeDayBtn.addEventListener('click', finalizeDay);

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        toggleTimer();
    }
});

// Inicializar app
init();