// modules/games/sub_games/tetris/tetris.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const linesElement = document.getElementById('lines');
const levelElement = document.getElementById('level');
const startBtn = document.getElementById('startBtn');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 25; 

const TETROMINOES = [
    [], 
    [[1, 1, 1, 1]], // I 
    [[2, 0, 0], [2, 2, 2]], // J 
    [[0, 0, 3], [3, 3, 3]], // L 
    [[4, 4], [4, 4]], // O 
    [[0, 5, 5], [5, 5, 0]], // S 
    [[0, 6, 0], [6, 6, 6]], // T 
    [[7, 7, 0], [0, 7, 7]]  // Z 
];

const COLORS = [
    null,
    '#00ffff', // 1 I
    '#0000ff', // 2 J
    '#ff7f00', // 3 L
    '#ffff00', // 4 O
    '#00ff00', // 5 S
    '#800080', // 6 T
    '#ff0000'  // 7 Z
];

let board = [];
let piece = null;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let timeElapsedInLevel = 0;

let score = 0;
let lines = 0;
let level = 1;
let highScore = 0;
let gameRunning = false;
let animationId;

function createBoard() {
    return Array.from({length: ROWS}, () => Array(COLS).fill(0));
}

async function loadHighScore() {
    if (typeof DataService !== 'undefined') {
        const savedScore = await DataService.get('tetris_highscore');
        if (savedScore) {
            highScore = savedScore;
            highScoreElement.textContent = highScore;
        }
    }
}

function spawnPiece() {
    const typeId = Math.floor(Math.random() * 7) + 1;
    const matrix = TETROMINOES[typeId];
    
    piece = {
        matrix: matrix,
        x: Math.floor(COLS / 2) - Math.floor(matrix[0].length / 2),
        y: 0
    };

    if (collides(board, piece)) {
        gameOver();
    }
}

function collides(board, piece) {
    for (let y = 0; y < piece.matrix.length; y++) {
        for (let x = 0; x < piece.matrix[y].length; x++) {
            if (piece.matrix[y][x] !== 0) {
                let boardX = piece.x + x;
                let boardY = piece.y + y;
                
                if (boardX < 0 || boardX >= COLS || boardY >= ROWS || (boardY >= 0 && board[boardY][boardX] !== 0)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function mergePiece() {
    for (let y = 0; y < piece.matrix.length; y++) {
        for (let x = 0; x < piece.matrix[y].length; x++) {
            if (piece.matrix[y][x] !== 0) {
                if (piece.y + y >= 0) {
                    board[piece.y + y][piece.x + x] = piece.matrix[y][x];
                }
            }
        }
    }
}

function sweepLines() {
    let linesCleared = 0;
    
    outer: for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] === 0) continue outer;
        }
        
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        y++; 
        linesCleared++;
    }

    if (linesCleared > 0) {
        lines += linesCleared;
        linesElement.textContent = lines;
        
        let lineScores = [0, 40, 100, 300, 1200]; 
        score += lineScores[linesCleared] * level;
        scoreElement.textContent = score;
    }
}

function dropPiece() {
    piece.y++;
    if (collides(board, piece)) {
        piece.y--;
        mergePiece();
        sweepLines();
        spawnPiece();
        dropCounter = 0; 
        return true;
    }
    dropCounter = 0;
    return false;
}

function movePiece(dir) {
    piece.x += dir;
    if (collides(board, piece)) {
        piece.x -= dir;
    }
}

function rotatePiece() {
    const matrix = piece.matrix;
    const N = matrix.length;
    const M = matrix[0].length;
    let rotated = Array.from({length: M}, () => Array(N).fill(0));
    
    for (let y = 0; y < N; y++) {
        for (let x = 0; x < M; x++) {
            rotated[x][N - 1 - y] = matrix[y][x];
        }
    }

    const oldMatrix = piece.matrix;
    piece.matrix = rotated;
    
    if (collides(board, piece)) {
        piece.matrix = oldMatrix;
    }
}

function update(time = 0) {
    if (!gameRunning) return;

    const deltaTime = time - lastTime;
    lastTime = time;
    
    dropCounter += deltaTime;
    timeElapsedInLevel += deltaTime;

    if (timeElapsedInLevel > 15000) {
        timeElapsedInLevel = 0;
        level++;
        levelElement.textContent = level;
        dropInterval = Math.max(100, dropInterval - 40); 
    }

    if (dropCounter > dropInterval) {
        dropPiece();
    }

    draw();
    animationId = requestAnimationFrame(update);
}

function draw() {
    ctx.fillStyle = '#1a252f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(board, 0, 0);
    if (piece) {
        drawMatrix(piece.matrix, piece.x, piece.y);
    }
}

function drawMatrix(matrix, offsetX, offsetY) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x] !== 0) {
                ctx.fillStyle = COLORS[matrix[y][x]];
                ctx.fillRect((x + offsetX) * BLOCK_SIZE, (y + offsetY) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillRect((x + offsetX) * BLOCK_SIZE, (y + offsetY) * BLOCK_SIZE, BLOCK_SIZE, 4);
                ctx.fillRect((x + offsetX) * BLOCK_SIZE, (y + offsetY) * BLOCK_SIZE, 4, BLOCK_SIZE);
                
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.fillRect((x + offsetX) * BLOCK_SIZE, (y + offsetY) * BLOCK_SIZE + BLOCK_SIZE - 4, BLOCK_SIZE, 4);
                ctx.fillRect((x + offsetX) * BLOCK_SIZE + BLOCK_SIZE - 4, (y + offsetY) * BLOCK_SIZE, 4, BLOCK_SIZE);
            }
        }
    }
}

async function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    startBtn.disabled = false;
    startBtn.textContent = 'שחק שוב';

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 30px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('המשחק נגמר!', canvas.width / 2, canvas.height / 2);

    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        if (typeof DataService !== 'undefined') {
            await DataService.save('tetris_highscore', highScore);
        }
        ctx.fillStyle = '#f1c40f'; 
        ctx.font = 'bold 20px Segoe UI';
        ctx.fillText('🏆 שיא חדש!', canvas.width / 2, canvas.height / 2 + 40);
    }
}

document.addEventListener('keydown', (event) => {
    if([37, 38, 39, 40].includes(event.keyCode)) {
        event.preventDefault();
    }

    if (!gameRunning) return;

    if (event.key === 'ArrowLeft') {
        movePiece(-1);
    } else if (event.key === 'ArrowRight') {
        movePiece(1);
    } else if (event.key === 'ArrowUp') {
        rotatePiece();
    } else if (event.key === 'ArrowDown') {
        // האצת נפילה - מוריד את החתיכה מיד למטה, ללא תוספת ניקוד
        dropPiece();
    }
    
    draw(); 
});

startBtn.addEventListener('click', () => {
    if (!gameRunning) {
        board = createBoard();
        score = 0;
        lines = 0;
        level = 1;
        dropInterval = 1000;
        timeElapsedInLevel = 0;
        
        scoreElement.textContent = score;
        linesElement.textContent = lines;
        levelElement.textContent = level;
        
        gameRunning = true;
        startBtn.disabled = true;
        startBtn.textContent = 'המשחק פועל...';
        
        spawnPiece();
        lastTime = performance.now();
        update(lastTime);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadHighScore();
    ctx.fillStyle = '#1a252f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '16px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('לחץ התחל כדי לשחק', canvas.width / 2, canvas.height / 2);
});