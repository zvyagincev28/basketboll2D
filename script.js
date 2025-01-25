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
const prevBallButton = document.getElementById('prevBallButton');
const nextBallButton = document.getElementById('nextBallButton');
const ballTypeDisplay = document.getElementById('ballTypeDisplay');
const prevFieldButton = document.getElementById('prevFieldButton');
const nextFieldButton = document.getElementById('nextFieldButton');
const fieldTypeDisplay = document.getElementById('fieldTypeDisplay');
const backToStartButton2 = document.getElementById('backToStartButton2');
const pauseButton = document.getElementById('pauseButton');
const pauseMenu = document.getElementById('pauseMenu');
const resumeButton = document.getElementById('resumeButton');
const pauseMenuButton = document.getElementById('pauseMenuButton');
const hoops = [
    {
        type: 'default',
        image: new Image(),
        src: 'assets/hoop_default.png'
    }
];

let coins = parseInt(localStorage.getItem('coins')) || 0;
const ballPrices = [0, 5, 10];
const fieldPrices = [0, 15, 20];

// Массив мячей
const balls = [
    { 
        type: 'basketball',
        image: new Image(),
        src: 'assets/default_ball.png',
        color: 'gray',
        unlocked: true
    },
    { 
        type: 'football',
        image: new Image(),
        src: 'assets/new_ball.png',
        color: 'brown',
        unlocked: false
    },
    { 
        type: 'volleyball',
        image: new Image(),
        src: 'assets/new_ball2.png',
        color: 'white',
        unlocked: false
    }
];

// Массив фонов (добавлено свойство unlocked)
const fields = [
    { type: 'default', color: 'lightgreen', unlocked: true },
    { type: 'park', color: 'darkgreen', unlocked: false },
    { type: 'gym', color: 'gray', unlocked: false }
];

// Предзагрузка изображений
balls.forEach(ball => {
    ball.image.src = ball.src;
    ball.image.onload = () => {
        console.log(`Изображение "${ball.type}" загружено`);
        drawBall();
    };
});
hoops.forEach(hoop => {
    hoop.image.src = hoop.src;
    hoop.image.onload = () => {
        console.log(`Изображение кольца загружено`);
        drawHoop();
    };
});

let playerName = '';
let score = 0;
let ballType = 'default';
let fieldType = 'default';
let ball = { x: canvas.width / 2, y: canvas.height - 50, radius: 20, dx: 0, dy: 0, isWallBounce: false}; // Стартовая позиция по центру
let hoop = { x: 50, y: 200, width: 80, height: 10, backboardWidth: 10, backboardHeight: 60 };
let isBallThrown = false;
let streak = 0;
let isScored = false;
let isCleanShot = true;
let isPaused = false;
let isGameOver = false;

let joystick = {
    x: 100,
    y: 500,
    radius: 30,
    baseRadius: 50,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragX: 0,
    dragY: 0,
    isVisible: false
};

const road = {
    x: 0,
    y: canvas.height - 30,
    width: canvas.width,
    height: 30,
};

const friction = 0.50;
const minSpeed = 1;

let ballIndex = 0;
let fieldIndex = 0;
// Монетки
let coinsArr = [];
class Coin {
    constructor() {
        this.x = Math.random() * (canvas.width - 30);
        this.y = Math.random() * (canvas.height - 100);
        this.radius = 12;
    }
}


function spawnCoins() {
    if (Math.random() < 0.02 && coinsArr.length < 5) {
        coinsArr.push(new Coin());
    }
}

function drawCoins() {
    coinsArr.forEach(coin => {
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
    });
}

function checkCoinCollision() {
    coinsArr = coinsArr.filter(coin => {
        const dx = ball.x - coin.x;
        const dy = ball.y - coin.y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);

        if (distance < ball.radius + coin.radius) {
            coins+= +1;
            localStorage.setItem('coins', coins);
            updateGameUI();
        }
        
        if (distance < ball.radius + coin.radius) {
            coins += 0;
            localStorage.setItem('coins', coins);
            document.getElementById('coinSound').play();
            return false;
        }
        return true;
    });
}

document.getElementById('buyBallButton').addEventListener('click', () => {
    if (coins >= ballPrices[ballIndex] && !balls[ballIndex].unlocked) {
        coins -= ballPrices[ballIndex];
        balls[ballIndex].unlocked = true;
        localStorage.setItem('coins', coins);
        updateShop();
        // Обновляем превью мяча
        document.getElementById('ballPreview').src = balls[ballIndex].src;
        alert('Мяч разблокирован!');
    }
});

function updateBallDisplay() {
    const currentBall = balls[ballIndex];
    document.getElementById('ballPrice').textContent = ballPrices[ballIndex];
    document.getElementById('buyBallButton').disabled = 
        currentBall.unlocked || coins < ballPrices[ballIndex];
}

function updateFieldDisplay() {
    const currentField = fields[fieldIndex];
    document.getElementById('fieldPrice').textContent = fieldPrices[fieldIndex];
    document.getElementById('buyFieldButton').disabled = 
        currentField.unlocked || coins < fieldPrices[fieldIndex];
}

// Раскомментирован код покупки фонов
document.getElementById('buyFieldButton').addEventListener('click', () => {
    if (coins >= fieldPrices[fieldIndex] && !fields[fieldIndex].unlocked) {
        coins -= fieldPrices[fieldIndex];
        fields[fieldIndex].unlocked = true;
        fieldType = fields[fieldIndex].type;
        localStorage.setItem('coins', coins);
        updateShop();
        alert('Фон разблокирован!');
    }
});

// Обновление магазина при открытии
customizeButton.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    customizeScreen.classList.remove('hidden');
    updateShop(); // Добавлен вызов
});

// Увеличен шанс появления монет
function spawnCoins() {
    if (Math.random() < 0.02 && coinsArr.length < 1) {
        coinsArr.push(new Coin());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
    drawField(); // Перемещено сюда
    gameLoop();  // Перемещено сюда
});

prevBallButton.addEventListener('click', () => {
    document.getElementById('buttonSound').play(); // Воспроизведение звука кнопки
    ballIndex = (ballIndex - 1 + balls.length) % balls.length;
    document.getElementById('ballPreview').src = balls[ballIndex].src;
    updateBallDisplay();
});

nextBallButton.addEventListener('click', () => {
    document.getElementById('buttonSound').play(); // Воспроизведение звука кнопки
    ballIndex = (ballIndex + 1) % balls.length;
    document.getElementById('ballPreview').src = balls[ballIndex].src;
    updateBallDisplay();
});

function updateBallDisplay() {
    const currentBall = balls[ballIndex];
    document.getElementById('ballPrice').textContent = ballPrices[ballIndex];
    document.getElementById('buyBallButton').disabled = currentBall.unlocked || coins < ballPrices[ballIndex];
    document.getElementById('backToStartButton2').disabled = !currentBall.unlocked;
}

prevFieldButton.addEventListener('click', () => {
    let newIndex = fieldIndex;
    do {
        newIndex = (newIndex - 1 + fields.length) % fields.length;
    } while (!fields[newIndex].unlocked && newIndex !== fieldIndex);
    
    if (fields[newIndex].unlocked) {
        fieldIndex = newIndex;
        fieldType = fields[fieldIndex].type;
        document.getElementById('fieldPreview').style.backgroundColor = fields[fieldIndex].color;
        updateFieldDisplay();
        drawField();
    }
});

nextFieldButton.addEventListener('click', () => {
    let newIndex = fieldIndex;
    do {
        newIndex = (newIndex + 1) % fields.length;
    } while (!fields[newIndex].unlocked && newIndex !== fieldIndex);
    
    if (fields[newIndex].unlocked) {
        fieldIndex = newIndex;
        fieldType = fields[fieldIndex].type; // Добавлено
        document.getElementById('fieldPreview').style.backgroundColor = fields[fieldIndex].color;
        updateFieldDisplay();
        drawField(); // Принудительная перерисовка
    }
});

// Обновленная функция отрисовки фона
function drawField() {
    ctx.fillStyle = fields[fieldIndex].color; // Используем текущий индекс
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'darkgray';
    ctx.fillRect(road.x, road.y, road.width, road.height);
}

updateBallDisplay();
updateFieldDisplay();

function resizeCanvas() {
    const width = window.innerWidth > 800 ? 800 : window.innerWidth;
    const height = window.innerHeight > 600 ? 600 : window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    road.y = canvas.height - 30;
    road.width = canvas.width;

    joystick.x = 100;
    joystick.y = canvas.height - 100; // Фиксированная позиция снизу

    ball.x = canvas.width / 2; // Центр по X
    ball.y = canvas.height - 50;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

startButton.addEventListener('click', () => {
    document.getElementById('buttonSound').play(); // Воспроизведение звука кнопки
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
    document.getElementById('buttonSound').play(); // Воспроизведение звука кнопки
    resetGame();
    restartButton.classList.add('hidden');
    menuButton.classList.add('hidden');
});

menuButton.addEventListener('click', () => {
    document.getElementById('buttonSound').play(); // Воспроизведение звука кнопки
    resetGame();
    gameScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    menuButton.classList.add('hidden');
});

pauseButton.addEventListener('click', () => {
    document.getElementById('buttonSound').play(); // Воспроизведение звука кнопки
    isPaused = true;
    pauseMenu.classList.remove('hidden');
});

resumeButton.addEventListener('click', () => {
    document.getElementById('buttonSound').play(); // Воспроизведение звука кнопки
    isPaused = false;
    pauseMenu.classList.add('hidden');
});

pauseMenuButton.addEventListener('click', () => {
    document.getElementById('buttonSound').play(); // Воспроизведение звука кнопки
    isPaused = false;
    pauseMenu.classList.add('hidden');
    gameScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    resetGame();
});

function drawBall() {
    const currentBall = balls[ballIndex];
    
    if (currentBall.image.complete) {
        ctx.drawImage(
            currentBall.image,
            ball.x - ball.radius,
            ball.y - ball.radius,
            ball.radius * 2,
            ball.radius * 2
        );
    } else {
        // Фолбэк с цветом из массива
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = currentBall.color;
        ctx.fill();
        ctx.closePath();
    }
}

function drawHoop() {
    const currentHoop = hoops[0]; // Используем первое кольцо (индекс 0)
    if (currentHoop.image.complete) {
        ctx.drawImage(
            currentHoop.image,
            hoop.x - 25, // Корректировка позиции
            hoop.y - 40,
            135,
            135
        );
    } else {
        // Фолбэк (старый код)
        ctx.fillStyle = 'red';
        ctx.fillRect(hoop.x, hoop.y, 10, hoop.height);
        ctx.fillRect(hoop.x + hoop.width - 10, hoop.y, 10, hoop.height);
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hoop.x, hoop.y + hoop.height);
        ctx.lineTo(hoop.x + hoop.width / 2, hoop.y + hoop.height + 20); // Исправлено ctx.lineTo
        ctx.lineTo(hoop.x + hoop.width, hoop.y + hoop.height);
        ctx.stroke();
    }
}

function drawJoystick() {
    if (!joystick.isVisible) return;
    
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

        ctx.strokeStyle = 'rgba(128, 128, 128, 0.76)'; // Серая линия
        ctx.setLineDash([5, 5]); // Пунктирная линия
        ctx.lineWidth = 2 + force / 5; // Линия увеличивается с силой броска
        ctx.stroke();
        ctx.closePath();
        ctx.setLineDash([]); // Сброс пунктирной линии
    }
}

canvas.addEventListener('mousedown', (e) => {
    if (isGameOver || isPaused) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Устанавливаем позицию джойстика и сохраняем начальные координаты касания
    joystick.x = mouseX;
    joystick.y = mouseY;
    joystick.isVisible = true;
    joystick.isDragging = true;
    joystick.dragStartX = mouseX; // Сохраняем абсолютные координаты
    joystick.dragStartY = mouseY;
});

canvas.addEventListener('mousemove', (e) => {
    if (!joystick.isDragging || isGameOver) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Рассчитываем смещение относительно начальной точки
    const deltaX = mouseX - joystick.dragStartX;
    const deltaY = mouseY - joystick.dragStartY;
    
    // Ограничиваем смещение радиусом джойстика
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    if (distance <= joystick.baseRadius) {
        joystick.dragX = deltaX;
        joystick.dragY = deltaY;
    } else {
        const angle = Math.atan2(deltaY, deltaX);
        joystick.dragX = Math.cos(angle) * joystick.baseRadius;
        joystick.dragY = Math.sin(angle) * joystick.baseRadius;
    }
});

canvas.addEventListener('mouseup', () => {
    joystick.isVisible = false;

    if (joystick.isDragging) {
        joystick.isDragging = false;
        throwBall();
        joystick.dragX = 0;
        joystick.dragY = 0;
    }
});

canvas.addEventListener('touchstart', (e) => {
    if (isGameOver || isPaused) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;

    // Устанавливаем позицию джойстика
    joystick.x = mouseX;
    joystick.y = mouseY;
    joystick.isVisible = true;
    joystick.isDragging = true;
    joystick.dragStartX = mouseX;
    joystick.dragStartY = mouseY;
});

canvas.addEventListener('touchmove', (e) => {
    if (!joystick.isDragging || isGameOver) return;
    e.preventDefault();

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;

    // Правильный расчет смещения относительно начальной точки
    const deltaX = mouseX - joystick.x; // Относительно центра джойстика
    const deltaY = mouseY - joystick.y;
    
    // Ограничение радиуса
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    if (distance <= joystick.baseRadius) {
        joystick.dragX = deltaX;
        joystick.dragY = deltaY;
    } else {
        const angle = Math.atan2(deltaY, deltaX);
        joystick.dragX = Math.cos(angle) * joystick.baseRadius;
        joystick.dragY = Math.sin(angle) * joystick.baseRadius;
    }
});

canvas.addEventListener('touchend', () => {
    joystick.isVisible = false;
    
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

function checkWallCollision() {
    // Столкновение с левой/правой стенкой
    if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
        ball.dx *= -0.8;
        ball.isWallBounce = true; // Устанавливаем флаг
        isCleanShot = false;

        // Корректировка позиции мяча, чтобы он не застревал в стене
        if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
        } else if (ball.x + ball.radius > canvas.width) {
            ball.x = canvas.width - ball.radius;
        }
    }

    if (ball.y + ball.radius >= hoop.y && ball.y - ball.radius <= hoop.y + hoop.height) {
        if (
            (ball.x + ball.radius >= hoop.x - hoop.backboardWidth && ball.x - ball.radius <= hoop.x) ||
            (ball.x + ball.radius >= hoop.x + hoop.width - 10 && ball.x - ball.radius <= hoop.x + hoop.width)
        ) {
            ball.dx *= -0.8;
            isCleanShot = false;
        }
    }
}

function checkCollision() {
    // Попадание в кольцо
    if (ball.y + ball.radius >= hoop.y && ball.y - ball.radius <= hoop.y + hoop.height &&
        ball.x + ball.radius >= hoop.x + 10 && ball.x - ball.radius <= hoop.x + hoop.width - 10) {
        if (!isScored && ball.dy > 0) { // Проверяем, что мяч летит вниз
            score += 1; // +1 за попадание
            scoreDisplay.textContent = score;
            isScored = true;
            moveHoop();
        }
    }

    // Падение на землю
    if (ball.y + ball.radius >= road.y) {
        ball.y = road.y - ball.radius;
        ball.dy *= -0.6;
        ball.dx *= friction;

        if (!isScored) {
            if (ball.isWallBounce) { // +2 за отскок от стены
                score += 2;
                streak++;
            } else { // Обнуление
                streak = 0;
                score = 0;
            }
            scoreDisplay.textContent = score;
            isGameOver = true;
            document.getElementById('gameCanvas').classList.add('blur');
            restartButton.classList.remove('hidden');
            menuButton.classList.remove('hidden');
        }

        // Сброс состояния
        if (Math.abs(ball.dy) < minSpeed && Math.abs(ball.dx) < minSpeed) {
            ball.dy = 0;
            ball.dx = 0;
            isBallThrown = false;
        }

        isCleanShot = false;
        ball.isWallBounce = false;
    } else if (ball.y > canvas.height) {
        // Мяч улетел за экран
        if (!isScored) {
            streak = 0;
            score = 0;
            scoreDisplay.textContent = score;
            isGameOver = true;
            document.getElementById('gameCanvas').classList.add('blur');
            restartButton.classList.remove('hidden');
            menuButton.classList.remove('hidden');
        }
        resetBall();
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
    if (!isPaused && isBallThrown && !isGameOver) {
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
        checkCoinCollision();
        draw();
        drawCoins();
        spawnCoins();
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
    document.getElementById('buttonSound').play(); // Воспроизведение звука кнопки
    startScreen.classList.add('hidden');
    recordsScreen.classList.remove('hidden');
    loadRecords();
});

backToStartButton.addEventListener('click', () => {
    document.getElementById('buttonSound').play(); // Воспроизведение звука кнопки
    recordsScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});

customizeButton.addEventListener('click', () => {
    document.getElementById('buttonSound').play(); // Воспроизведение звука кнопки
    startScreen.classList.add('hidden');
    customizeScreen.classList.remove('hidden');
});

backToStartButton2.addEventListener('click', () => {
    document.getElementById('buttonSound').play(); // Воспроизведение звука кнопки
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
    isGameOver = false;
    document.getElementById('gameCanvas').classList.remove('blur');
    ball.x = canvas.width / 2; // Центр
    ball.y = canvas.height - 50; // Стартовая позиция
}

// Логика магазина
document.getElementById('toggleBallsButton').addEventListener('click', () => {
    document.getElementById('ballsSection').classList.remove('hidden');
    document.getElementById('fieldsSection').classList.add('hidden');
});

document.getElementById('toggleFieldsButton').addEventListener('click', () => {
    document.getElementById('fieldsSection').classList.remove('hidden');
    document.getElementById('ballsSection').classList.add('hidden');
});

document.getElementById('backToStartButton2').addEventListener('click', () => {
    customizeScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});

function updateShop() {
    document.getElementById('coinsDisplay').textContent = coins;
    document.getElementById('ballPrice').textContent = ballPrices[ballIndex];
    document.getElementById('fieldPrice').textContent = fieldPrices[fieldIndex];
    
    // Проверка доступности текущих предметов
    const backButton = document.getElementById('backToStartButton2');
    backButton.disabled = 
        !balls[ballIndex].unlocked || 
        !fields[fieldIndex].unlocked;
    // Проверка доступности покупки
    document.getElementById('buyBallButton').disabled = 
        balls[ballIndex].unlocked || coins < ballPrices[ballIndex];
        
    document.getElementById('buyFieldButton').disabled = 
        fields[fieldIndex].unlocked || coins < fieldPrices[fieldIndex];
} 

function updateGameUI() {
    document.getElementById('coinsDisplayGame').textContent = coins;
}
document.getElementById('customizeButton').addEventListener('click', () => {
    updateShop();
});

prevFieldButton.addEventListener('click', () => {
    document.getElementById('buttonSound').play(); // Воспроизведение звука кнопки
    fieldIndex = (fieldIndex - 1 + fields.length) % fields.length;
    document.getElementById('fieldPreview').style.backgroundColor = fields[fieldIndex].color;
    updateFieldDisplay();
});

nextFieldButton.addEventListener('click', () => {
    document.getElementById('buttonSound').play(); // Воспроизведение звука кнопки
    fieldIndex = (fieldIndex + 1) % fields.length;
    document.getElementById('fieldPreview').style.backgroundColor = fields[fieldIndex].color;
    updateFieldDisplay();
});

// Аналогично для фонов
prevFieldButton.addEventListener('click', () => {
    let newIndex = fieldIndex;
    do {
        newIndex = (newIndex - 1 + fields.length) % fields.length;
    } while (!fields[newIndex].unlocked && newIndex !== fieldIndex);
    
    if (fields[newIndex].unlocked) {
        fieldIndex = newIndex;
        updateFieldDisplay();
    }
});
function draw() {
    drawField();
    drawHoop(); // Сначала рисуем кольцо
    drawBall(); // Затем мяч
    drawJoystick();
    drawTrajectory();
}

drawField();
gameLoop();