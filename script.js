const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const menuButton = document.getElementById('menuButton');
const scoreDisplay = document.getElementById('score');
const showRecordsButton = document.getElementById('showRecordsButton');
const recordsScreen = document.getElementById('recordsScreen');
const recordsList = document.getElementById('recordsList');
const backToStartButton = document.getElementById('backToStartButton');
const customizeButton = document.getElementById('customizeButton');
const customizeScreen = document.getElementById('customizeScreen');
const ballSelect = document.getElementById('ballSelect');
const fieldSelect = document.getElementById('fieldSelect');
const backToStartButton2 = document.getElementById('backToStartButton2');
const pauseButton = document.getElementById('pauseButton'); // Новая кнопка "Пауза"
const pauseMenu = document.getElementById('pauseMenu'); // Меню паузы
const resumeButton = document.getElementById('resumeButton'); // Кнопка "Продолжить игру"
const pauseMenuButton = document.getElementById('pauseMenuButton'); // Кнопка "Меню" в паузе

let playerName = '';
let score = 0;
let ballType = 'default';
let fieldType = 'default';
let ball = { x: 400, y: 550, radius: 20, dx: 0, dy: 0 };
let hoop = { x: 50, y: 200, width: 80, height: 10, backboardWidth: 10, backboardHeight: 60 };
let isBallThrown = false;
let streak = 0;
let isScored = false;
let isCleanShot = true;
let isPaused = false; // Состояние паузы

let joystick = {
    x: 100,
    y: 500,
    radius: 30,
    baseRadius: 50,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragX: 0,
    dragY: 0
};

const balls = [
    { type: 'default', color: 'orange' },
    { type: 'basketball', color: 'brown' },
    { type: 'volleyball', color: 'white' }
];

const fields = [
    { type: 'default', color: 'lightgreen' },
    { type: 'park', color: 'darkgreen' },
    { type: 'gym', color: 'gray' }
];

const road = {
    x: 0,
    y: canvas.height - 20,
    width: canvas.width,
    height: 20,
};

const friction = 0.50;
const minSpeed = 1;

balls.forEach(ball => {
    const option = document.createElement('option');
    option.value = ball.type;
    option.textContent = ball.type;
    ballSelect.appendChild(option);
});

fields.forEach(field => {
    const option = document.createElement('option');
    option.value = field.type;
    option.textContent = field.type;
    fieldSelect.appendChild(option);
});

ballSelect.addEventListener('change', (e) => {
    ballType = e.target.value;
});

fieldSelect.addEventListener('change', (e) => {
    fieldType = e.target.value;
    drawField();
});

startButton.addEventListener('click', () => {
    playerName = document.getElementById('playerName').value.trim();
    if (playerName === '') {
        alert('Пожалуйста, введите ваше имя!');
        return;
    }
    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    resetGame();
});

restartButton.addEventListener('click', () => {
    resetGame();
    restartButton.classList.add('hidden');
    menuButton.classList.add('hidden');
});

menuButton.addEventListener('click', () => {
    resetGame();
    gameScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    menuButton.classList.add('hidden');
});

pauseButton.addEventListener('click', () => {
    isPaused = true;
    pauseMenu.classList.remove('hidden');
});

resumeButton.addEventListener('click', () => {
    isPaused = false;
    pauseMenu.classList.add('hidden');
});

pauseMenuButton.addEventListener('click', () => {
    isPaused = false;
    pauseMenu.classList.add('hidden');
    gameScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    resetGame();
});

function drawField() {
    const field = fields.find(f => f.type === fieldType);
    ctx.fillStyle = field.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'darkgray';
    ctx.fillRect(road.x, road.y, road.width, road.height);
}

function drawBall() {
    const ballStyle = balls.find(b => b.type === ballType);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ballStyle.color;
    ctx.fill();
    ctx.closePath();
}

function drawHoop() {
    ctx.fillStyle = 'black';
    ctx.fillRect(hoop.x - hoop.backboardWidth, hoop.y, hoop.backboardWidth, hoop.backboardHeight);

    ctx.fillStyle = 'red';
    ctx.fillRect(hoop.x, hoop.y, 10, hoop.height);
    ctx.fillRect(hoop.x + hoop.width - 10, hoop.y, 10, hoop.height);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hoop.x, hoop.y + hoop.height);
    ctx.lineTo(hoop.x + hoop.width / 2, hoop.y + hoop.height + 20);
    ctx.lineTo(hoop.x + hoop.width, hoop.y + hoop.height);
    ctx.stroke();
}

function drawJoystick() {
    ctx.beginPath();
    ctx.arc(joystick.x, joystick.y, joystick.baseRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(joystick.x + joystick.dragX, joystick.y + joystick.dragY, joystick.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();
    ctx.closePath();
}

function drawTrajectory() {
    if (joystick.isDragging) {
        const force = Math.sqrt(joystick.dragX ** 2 + joystick.dragY ** 2) / 3;
        const angle = Math.atan2(-joystick.dragY, -joystick.dragX);

        let x = ball.x;
        let y = ball.y;
        let dx = Math.cos(angle) * force;
        let dy = Math.sin(angle) * force;

        ctx.beginPath();
        ctx.moveTo(x, y);

        for (let i = 0; i < 100; i++) {
            x += dx;
            y += dy;
            dy += 0.2;
            ctx.lineTo(x, y);
        }

        ctx.strokeStyle = 'rgba(246, 7, 7, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }
}

canvas.addEventListener('mousedown', (e) => {
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;

    const distance = Math.sqrt((mouseX - joystick.x) ** 2 + (mouseY - joystick.y) ** 2);
    if (distance <= joystick.baseRadius) {
        joystick.isDragging = true;
        joystick.dragStartX = mouseX - joystick.x;
        joystick.dragStartY = mouseY - joystick.y;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (joystick.isDragging) {
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        const deltaX = mouseX - joystick.x - joystick.dragStartX;
        const deltaY = mouseY - joystick.y - joystick.dragStartY;
        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

        if (distance <= joystick.baseRadius) {
            joystick.dragX = deltaX;
            joystick.dragY = deltaY;
        } else {
            const angle = Math.atan2(deltaY, deltaX);
            joystick.dragX = Math.cos(angle) * joystick.baseRadius;
            joystick.dragY = Math.sin(angle) * joystick.baseRadius;
        }
    }
});

canvas.addEventListener('mouseup', () => {
    if (joystick.isDragging) {
        joystick.isDragging = false;
        throwBall();
        joystick.dragX = 0;
        joystick.dragY = 0;
    }
});

canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const mouseX = touch.clientX - canvas.offsetLeft;
    const mouseY = touch.clientY - canvas.offsetTop;

    const distance = Math.sqrt((mouseX - joystick.x) ** 2 + (mouseY - joystick.y) ** 2);
    if (distance <= joystick.baseRadius) {
        joystick.isDragging = true;
        joystick.dragStartX = mouseX - joystick.x;
        joystick.dragStartY = mouseY - joystick.y;
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (joystick.isDragging) {
        const touch = e.touches[0];
        const mouseX = touch.clientX - canvas.offsetLeft;
        const mouseY = touch.clientY - canvas.offsetTop;

        const deltaX = mouseX - joystick.x - joystick.dragStartX;
        const deltaY = mouseY - joystick.y - joystick.dragStartY;
        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

        if (distance <= joystick.baseRadius) {
            joystick.dragX = deltaX;
            joystick.dragY = deltaY;
        } else {
            const angle = Math.atan2(deltaY, deltaX);
            joystick.dragX = Math.cos(angle) * joystick.baseRadius;
            joystick.dragY = Math.sin(angle) * joystick.baseRadius;
        }
    }
});

canvas.addEventListener('touchend', () => {
    if (joystick.isDragging) {
        joystick.isDragging = false;
        throwBall();
        joystick.dragX = 0;
        joystick.dragY = 0;
    }
});

function throwBall() {
    if (!isBallThrown) {
        const force = Math.sqrt(joystick.dragX ** 2 + joystick.dragY ** 2) / 3;
        const angle = Math.atan2(-joystick.dragY, -joystick.dragX);
        ball.dx = Math.cos(angle) * force;
        ball.dy = Math.sin(angle) * force;
        isBallThrown = true;
        isScored = false;
        isCleanShot = true;
    }
}

function checkCollision() {
    if (ball.dy > 0 &&
        ball.y + ball.radius >= hoop.y && ball.y - ball.radius <= hoop.y + hoop.height &&
        ball.x + ball.radius >= hoop.x + 10 && ball.x - ball.radius <= hoop.x + hoop.width - 10) {
        if (!isScored) {
            scoreSound.play();
            streak += 1;
            score += streak;
            scoreDisplay.textContent = score;
            isScored = true;
            moveHoop();
        }
    } else if (ball.y + ball.radius >= road.y) {
        ball.y = road.y - ball.radius;
        ball.dy *= -0.6;
        ball.dx *= friction;

        if (!isScored) {
            streak = 0;
            score = 0;
            scoreDisplay.textContent = score;
            restartButton.classList.remove('hidden');
            menuButton.classList.remove('hidden');
        }

        if (Math.abs(ball.dy) < minSpeed && Math.abs(ball.dx) < minSpeed) {
            ball.dy = 0;
            ball.dx = 0;
            isBallThrown = false;
        }

        isCleanShot = false;
    } else if (ball.y > canvas.height) {
        if (!isScored) {
            streak = 0;
            score = 0;
            scoreDisplay.textContent = score;
            restartButton.classList.remove('hidden');
            menuButton.classList.remove('hidden');
        }
        resetBall();
    }
}

function checkWallCollision() {
    if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
        ball.dx *= -0.8;
        isCleanShot = false;
    }

    if (ball.y + ball.radius >= hoop.y && ball.y - ball.radius <= hoop.y + hoop.height &&
        ball.x + ball.radius >= hoop.x - hoop.backboardWidth && ball.x - ball.radius <= hoop.x) {
        ball.dx *= -0.8;
        isCleanShot = false;
    }

    if (ball.y + ball.radius >= hoop.y && ball.y - ball.radius <= hoop.y + hoop.height) {
        if (ball.x + ball.radius >= hoop.x && ball.x - ball.radius <= hoop.x + 10) {
            ball.dx *= -0.8;
            isCleanShot = false;
        }
        if (ball.x + ball.radius >= hoop.x + hoop.width - 10 && ball.x - ball.radius <= hoop.x + hoop.width) {
            ball.dx *= -0.8;
            isCleanShot = false;
        }
    }
}

function resetBall() {
    if (ball.y + ball.radius >= canvas.height) {
        ball.y = canvas.height - ball.radius;
    }
    ball.dx = 0;
    ball.dy = 0;
    isBallThrown = false;
}

function moveHoop() {
    hoop.x = Math.random() * (canvas.width - hoop.width);
    hoop.y = Math.random() * (canvas.height / 2 - hoop.height);
}

function update() {
    if (!isPaused && isBallThrown) {
        ball.x += ball.dx;
        ball.y += ball.dy;
        ball.dy += 0.2;
        checkWallCollision();
        checkCollision();
    }
}

function draw() {
    drawField();
    drawBall();
    drawHoop();
    drawJoystick();
    drawTrajectory();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function loadRecords() {
    const records = JSON.parse(localStorage.getItem('records')) || [];
    recordsList.innerHTML = '';
    records.forEach((record, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${record.name}: ${record.score} очков`;
        recordsList.appendChild(li);
    });
}

function saveRecord() {
    const records = JSON.parse(localStorage.getItem('records')) || [];
    records.push({ name: playerName, score: score });
    records.sort((a, b) => b.score - a.score);
    localStorage.setItem('records', JSON.stringify(records));
    loadRecords();
}

showRecordsButton.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    recordsScreen.classList.remove('hidden');
    loadRecords();
});

backToStartButton.addEventListener('click', () => {
    recordsScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});

customizeButton.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    customizeScreen.classList.remove('hidden');
});

backToStartButton2.addEventListener('click', () => {
    customizeScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});

function resetGame() {
    if (score > 0) {
        saveRecord();
    }
    score = 0;
    streak = 0;
    scoreDisplay.textContent = score;
    resetBall();
    hoop.x = 50;
    hoop.y = 200;
    restartButton.classList.add('hidden');
    menuButton.classList.add('hidden');
    isPaused = false;
    pauseMenu.classList.add('hidden');
}

drawField();
gameLoop();