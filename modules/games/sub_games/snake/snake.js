// modules/games/sub_games/snake/snake.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const levelElement = document.getElementById('levelDisplay');
const startBtn = document.getElementById('startBtn');

const gridSize = 20;
const tileCount = canvas.width / gridSize; 

let snake = [];
let food = null;
let portal = null;
let obstacles = [];
let dx = 0;
let dy = 0;
let score = 0;
let currentLevel = 1;
const maxLevel = 10;
let highScore = 0;
let gameSpeed = 120; 
let gameRunning = false;
let gameLoopTimeout;
let pauseTicks = 0; // השהייה למעבר שלב

async function loadHighScore() {
    if (typeof DataService !== 'undefined') {
        const savedScore = await DataService.get('snake_highscore');
        if (savedScore) {
            highScore = savedScore;
            highScoreElement.textContent = highScore;
        }
    }
}

function resetGame() {
    score = 0;
    currentLevel = 1;
    scoreElement.textContent = score;
    levelElement.textContent = currentLevel;
    prepareLevel();
}

function prepareLevel() {
    // איפוס הנחש למרכז
    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    dx = 0;
    dy = -1; // מתחיל לעלות
    
    portal = null;
    food = null;
    
    // הגברת מהירות בכל שלב
    gameSpeed = Math.max(60, 120 - ((currentLevel - 1) * 5));
    
    generateObstacles();
    spawnFood();
}

/**
 * ייצור מכשולים (בלוקים) בצורה סימטרית שהולכת ומסתבכת מפרק לפרק
 */
function generateObstacles() {
    obstacles = [];
    if (currentLevel === 1) return; // שלב 1 נקי

    if (currentLevel >= 2) obstacles.push({x:5,y:5}, {x:14,y:5}, {x:5,y:14}, {x:14,y:14});
    if (currentLevel >= 3) obstacles.push({x:9,y:5}, {x:10,y:5}, {x:9,y:14}, {x:10,y:14});
    if (currentLevel >= 4) obstacles.push({x:5,y:9}, {x:5,y:10}, {x:14,y:9}, {x:14,y:10});
    if (currentLevel >= 5) obstacles.push({x:3,y:3}, {x:16,y:3}, {x:3,y:16}, {x:16,y:16});
    if (currentLevel >= 6) obstacles.push({x:7,y:7}, {x:12,y:7}, {x:7,y:12}, {x:12,y:12});
    if (currentLevel >= 7) obstacles.push({x:9,y:2}, {x:10,y:2}, {x:9,y:17}, {x:10,y:17});
    if (currentLevel >= 8) obstacles.push({x:2,y:9}, {x:2,y:10}, {x:17,y:9}, {x:17,y:10});
    if (currentLevel >= 9) obstacles.push({x:7,y:3}, {x:12,y:3}, {x:7,y:16}, {x:12,y:16});
    if (currentLevel >= 10) obstacles.push({x:3,y:7}, {x:3,y:12}, {x:16,y:7}, {x:16,y:12});
}

function getSafeRandomPosition() {
    let pos;
    let safe = false;
    while (!safe) {
        pos = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        safe = true;
        
        // בדיקה שלא נופל על הנחש
        for (let segment of snake) {
            if (segment.x === pos.x && segment.y === pos.y) safe = false;
        }
        // בדיקה שלא נופל על מכשול
        for (let obs of obstacles) {
            if (obs.x === pos.x && obs.y === pos.y) safe = false;
        }
    }
    return pos;
}

function spawnFood() {
    food = getSafeRandomPosition();
}

function spawnPortal() {
    food = null; // מוחק את התפוח כדי לחייב כניסה לפורטל
    portal = getSafeRandomPosition();
}

function drawGame() {
    if (!gameRunning) return;

    // מנגנון השהייה (Pause) חזותי למעבר שלב
    if (pauseTicks > 0) {
        clearCanvas();
        drawObstacles();
        drawSnake();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#9b59b6';
        ctx.font = 'bold 35px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(`עולם ${currentLevel}`, canvas.width / 2, canvas.height / 2);
        
        pauseTicks--;
        gameLoopTimeout = setTimeout(drawGame, gameSpeed);
        return;
    }

    moveSnake();

    if (checkCollision()) {
        gameOver();
        return;
    }

    clearCanvas();
    drawObstacles();
    if (food) drawFood();
    if (portal) drawPortal();
    drawSnake();

    gameLoopTimeout = setTimeout(drawGame, gameSpeed);
}

function clearCanvas() {
    ctx.fillStyle = '#2c3e50'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawObstacles() {
    ctx.fillStyle = '#7f8c8d'; // צבע אפור לבלוקים
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x * gridSize, obs.y * gridSize, gridSize - 1, gridSize - 1);
    });
}

function drawSnake() {
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#2ecc71' : '#27ae60';
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
    });
}

function drawFood() {
    ctx.fillStyle = '#e74c3c'; 
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1);
}

function drawPortal() {
    ctx.fillStyle = '#9b59b6'; // צבע סגול זוהר
    ctx.fillRect(portal.x * gridSize, portal.y * gridSize, gridSize - 1, gridSize - 1);
    // מסגרת פנימית קטנה לאפקט של כניסה
    ctx.fillStyle = '#8e44ad';
    ctx.fillRect((portal.x * gridSize) + 4, (portal.y * gridSize) + 4, gridSize - 9, gridSize - 9);
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head); 

    // אכילת תפוח
    if (food && head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        
        // כל 150 נקודות פותח את הפורטל, אחרת תפוח חדש
        if (score % 150 === 0 && currentLevel < maxLevel) {
            spawnPortal();
        } else {
            spawnFood();
        }
    } 
    // כניסה לפורטל עולמות
    else if (portal && head.x === portal.x && head.y === portal.y) {
        currentLevel++;
        levelElement.textContent = currentLevel;
        
        if (currentLevel > maxLevel) {
            gameWin();
        } else {
            prepareLevel();
            pauseTicks = 15; // משהה את המשחק לכ-1.5 שניות להצגת מעבר שלב
        }
    } 
    // תנועה רגילה
    else {
        snake.pop();
    }
}

function checkCollision() {
    const head = snake[0];
    
    // קירות
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) return true;

    // מכשולים
    for (let obs of obstacles) {
        if (head.x === obs.x && head.y === obs.y) return true;
    }

    // גוף הנחש
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) return true;
    }

    return false;
}

async function saveScore() {
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        if (typeof DataService !== 'undefined') {
            await DataService.save('snake_highscore', highScore);
        }
        return true;
    }
    return false;
}

async function gameOver() {
    gameRunning = false;
    startBtn.disabled = false;
    startBtn.textContent = 'שחק שוב';
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('נפסלת!', canvas.width / 2, canvas.height / 2);
    
    const isNewRecord = await saveScore();
    if (isNewRecord) {
        ctx.fillStyle = '#f1c40f'; 
        ctx.font = 'bold 22px Segoe UI';
        ctx.fillText('🏆 שיא חדש!', canvas.width / 2, canvas.height / 2 + 40);
    }
}

async function gameWin() {
    gameRunning = false;
    startBtn.disabled = false;
    startBtn.textContent = 'התחל מהתחלה';
    
    ctx.fillStyle = 'rgba(46, 204, 113, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 30px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 כל הכבוד!', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '20px Segoe UI';
    ctx.fillText('סיימת את כל 10 העולמות!', canvas.width / 2, canvas.height / 2 + 20);
    
    await saveScore();
}

document.addEventListener('keydown', (e) => {
    if([37, 38, 39, 40].includes(e.keyCode)) e.preventDefault();
    if (!gameRunning || pauseTicks > 0) return;

    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    if (e.key === 'ArrowLeft' && !goingRight) { dx = -1; dy = 0; }
    if (e.key === 'ArrowUp' && !goingDown) { dx = 0; dy = -1; }
    if (e.key === 'ArrowRight' && !goingLeft) { dx = 1; dy = 0; }
    if (e.key === 'ArrowDown' && !goingUp) { dx = 0; dy = 1; }
});

startBtn.addEventListener('click', () => {
    if (!gameRunning) {
        gameRunning = true;
        startBtn.disabled = true;
        startBtn.textContent = 'המשחק פועל...';
        clearTimeout(gameLoopTimeout);
        resetGame();
        drawGame();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadHighScore();
    clearCanvas();
    ctx.fillStyle = 'white';
    ctx.font = '20px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('לחץ על "התחל משחק" כדי לשחק', canvas.width / 2, canvas.height / 2);
});