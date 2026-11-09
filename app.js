let xp = 0;
let level = 1;
let tasks = [];

// Simple Audio Engine (Synthesizes sound directly in browser)
function playSound(type) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'complete') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(); 
        osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'levelup') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(450, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(900, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(); 
        osc.stop(ctx.currentTime + 0.5);
    }
}

function addTask() {
    const input = document.getElementById('taskInput');
    if (!input.value.trim()) return;

    const newTask = {
        id: Date.now().toString(),
        text: input.value,
        status: 'dump', // Always defaults to Brain Dump Zone
        timestamp: new Date()
    };

    tasks.push(newTask);
    input.value = '';
    renderTasks();
}

function renderTasks() {
    const lists = {
        dump: document.getElementById('dumpList'),
        todo: document.getElementById('todoList'),
        done: document.getElementById('doneList')
    };

    // Clear lists before rebuilding
    Object.values(lists).forEach(list => list.innerHTML = '');

    tasks.forEach(task => {
        const taskEl = document.createElement('div');
        taskEl.classList.add('task');
        taskEl.setAttribute('draggable', 'true');
        taskEl.setAttribute('id', task.id);
        taskEl.addEventListener('dragstart', dragStart);
        taskEl.addEventListener('dragend', dragEnd);

        taskEl.innerHTML = `
            <span>${task.text}</span>
            <div class="task-buttons">
                ${task.status !== 'done' ? `<button onclick="changeStatus('${task.id}', 'done')">✅</button>` : ''}
                <button onclick="deleteTask('${task.id}')">❌</button>
            </div>
        `;

        lists[task.status].appendChild(taskEl);
    });
}

// Drag and Drop Controllers
function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.id);
    setTimeout(() => e.target.classList.add('dragging'), 0);
}

// Drag End Hook
function dragEnd(e) {
    e.target.classList.remove('dragging');
}

function allowDrop(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const targetColumn = e.target.closest('.column');
    if (targetColumn) {
        const newStatus = targetColumn.getAttribute('data-status');
        changeStatus(id, newStatus);
    }
}

function changeStatus(id, newStatus) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        const oldStatus = task.status;
        task.status = newStatus;
        
        // Triggers rewards only on a forward move to Done column
        if (newStatus === 'done' && oldStatus !== 'done') {
            gainXP(25);
            playSound('complete');
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        
        renderTasks();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
}

// Experience Engine
function gainXP(amount) {
    xp += amount;
    if (xp >= 100) {
        xp -= 100;
        level++;
        playSound('levelup');
        confetti({ particleCount: 200, spread: 100, colors: ['#ff0000', '#00ff00', '#0000ff'] });
    }
    updateXPBar();
}

function updateXPBar() {
    document.getElementById('xpBar').style.width = `${xp}%`;
    document.getElementById('xpDisplay').innerText = xp;
    document.getElementById('levelDisplay').innerText = level;
}

// Sorting Functions
function sortColumn(status, criteria) {
    const columnTasks = tasks.filter(t => t.status === status);
    
    if (criteria === 'alpha') {
        columnTasks.sort((a, b) => a.text.localeCompare(b.text));
    } else if (criteria === 'newest') {
        columnTasks.sort((a, b) => b.id - a.id);
    }

    tasks = tasks.filter(t => t.status !== status).concat(columnTasks);
    renderTasks();
}

// Global Enter Key Listener for accessibility
document.getElementById('taskInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});
