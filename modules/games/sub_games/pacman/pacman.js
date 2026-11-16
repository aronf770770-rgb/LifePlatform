// modules/games/sub_games/pacman/pacman.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 30;
let animationId = null; 
let lastTime = 0;

// מנוע סאונד אופליין
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'chomp') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'fruit') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'death') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 1.5);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
        osc.start(); osc.stop(audioCtx.currentTime + 1.5);
    } else if (type === 'power') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.start(); osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'eat_ghost') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    }
}

const levels = [
    [ // שלב 1 - קלאסי
        "1111111111111111111",
        "1700000001000000071",
        "1011101111111011101",
        "1000000000000000001",
        "1011101011101011101",
        "1000001000001000001",
        "1111101110111011111",
        "2222100000000012222",
        "1111101133311011111",
        "2222201244421022222",
        "1111101111111011111",
        "2222100005000012222",
        "1111101110111011111",
        "1000000000000000001",
        "1011111101011111101",
        "1000010006000100001",
        "1110110111110110111",
        "1700000000000000071",
        "1111111111111111111"
    ],
    [ // שלב 2 - טבעת כפולה
        "1111111111111111111",
        "1700000000000000071",
        "1011111110111111101",
        "1010000010100000101",
        "1010111010101110101",
        "1010000000000000101",
        "1011111110111111101",
        "1000000000000000001",
        "1111101133311011111",
        "2222201244421022222",
        "1111101111111011111",
        "1000000005000000001",
        "1011111110111111101",
        "1010000000000000101",
        "1010111010101110101",
        "1010000010100000101",
        "1011111110111111101",
        "1700000006000000071",
        "1111111111111111111"
    ],
    [ // שלב 3 - מסדרונות ארוכים
        "1111111111111111111",
        "1700000001000000071",
        "1011111101011111101",
        "1000000000000000001",
        "1011111111111111101",
        "1000000000000000001",
        "1111101110111011111",
        "2222101000001012222",
        "1111101033301011111",
        "2222200044400022222",
        "1111101011101011111",
        "2222101005001012222",
        "1111101110111011111",
        "1000000000000000001",
        "1011111111111111101",
        "1000000006000000001",
        "1011111101011111101",
        "1700000001000000071",
        "1111111111111111111"
    ],
    [ // שלב 4 - בלוקים קטנים
        "1111111111111111111",
        "1700000000000000071",
        "1010101011101010101",
        "1010101000001010101",
        "1010101011101010101",
        "1000000000000000001",
        "1111101110111011111",
        "2222100000000012222",
        "1111101133311011111",
        "2222201244421022222",
        "1111101111111011111",
        "2222100005000012222",
        "1111101110111011111",
        "1000000000000000001",
        "1010101011101010101",
        "1010101006001010101",
        "1010101011101010101",
        "1700000000000000071",
        "1111111111111111111"
    ]
];

const LEVEL_COLORS = ['#0984e3', '#2ecc71', '#e74c3c', '#9b59b6']; 
const GHOST_COLORS = ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852'];

let currentLevelIndex = 0;
let map = [];
let score = 0;
let highScore = localStorage.getItem('pacmanHighScore') || 0;
let lives = 3;
let totalDots = 0;
let frameCount = 0;

let frightenedTimer = 0;
let ghostEatMultiplier = 200;
let freezeTimer = 0; 

let pacman = null;
let ghosts = [];
let apples = [];
let floatingTexts = []; 

const DIRS = {
    'UP': {x: 0, y: -1, angle: -Math.PI/2},
    'DOWN': {x: 0, y: 1, angle: Math.PI/2},
    'LEFT': {x: -1, y: 0, angle: Math.PI},
    'RIGHT': {x: 1, y: 0, angle: 0}
};

function getCenter(r, c) {
    return { x: c * TILE_SIZE + TILE_SIZE/2, y: r * TILE_SIZE + TILE_SIZE/2 };
}

// --- מחלקות ---

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0; 
    }
    update(dt) {
        this.life -= dt / 1000;
        this.y -= 30 * (dt / 1000); 
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.shadowBlur = 4;
        ctx.shadowColor = "black";
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class Pacman {
    constructor(r, c) {
        this.startR = r; this.startC = c;
        this.reset();
        this.speed = 150; 
        this.mouthOpen = 0;
        this.mouthDir = 1;
        this.state = 'normal'; 
    }

    reset() {
        this.r = this.startR; this.c = this.startC;
        const center = getCenter(this.r, this.c);
        this.x = center.x; this.y = center.y;
        this.targetX = this.x; this.targetY = this.y;
        this.dir = null;
        this.nextDir = null;
        this.angle = 0;
        this.state = 'normal';
        this.mouthOpen = 0;
    }

    canMove(dirKey) {
        if (!dirKey) return false;
        const d = DIRS[dirKey];
        let checkC = this.c + d.x;
        let checkR = this.r + d.y;
        
        if (checkC < 0) checkC = map[0].length - 1;
        if (checkC >= map[0].length) checkC = 0;

        return map[checkR] && map[checkR][checkC] !== 1 && map[checkR][checkC] !== 3;
    }

    update(dt) {
        if (this.state === 'dying') {
            this.mouthOpen += 0.8 * (dt / 1000);
            if (this.mouthOpen >= 1) this.mouthOpen = 1;
            return;
        }

        // 1. מאפשר סיבוב פרסה מיידי
        if (this.nextDir && this.dir) {
            if (DIRS[this.nextDir].x === -DIRS[this.dir].x && DIRS[this.nextDir].y === -DIRS[this.dir].y) {
                this.dir = this.nextDir;
                this.targetX = this.c * TILE_SIZE + TILE_SIZE/2;
                this.targetY = this.r * TILE_SIZE + TILE_SIZE/2;
                this.angle = DIRS[this.dir].angle;
            }
        }

        // 2. התנעה ממצב עצירה (התיקון לבאג ההקפאה)
        if (!this.dir && this.nextDir) {
            if (this.canMove(this.nextDir)) {
                this.dir = this.nextDir;
                this.targetX = this.x + DIRS[this.dir].x * TILE_SIZE;
                this.targetY = this.y + DIRS[this.dir].y * TILE_SIZE;
                this.angle = DIRS[this.dir].angle;
            }
        }

        // 3. תנועה רציפה
        if (this.dir) {
            const step = this.speed * (dt / 1000);
            let reachedTarget = false;

            if (this.dir === 'RIGHT' && this.x + step >= this.targetX) reachedTarget = true;
            else if (this.dir === 'LEFT' && this.x - step <= this.targetX) reachedTarget = true;
            else if (this.dir === 'DOWN' && this.y + step >= this.targetY) reachedTarget = true;
            else if (this.dir === 'UP' && this.y - step <= this.targetY) reachedTarget = true;

            if (reachedTarget) {
                let overshoot = 0;
                if (this.dir === 'RIGHT') overshoot = (this.x + step) - this.targetX;
                else if (this.dir === 'LEFT') overshoot = this.targetX - (this.x - step);
                else if (this.dir === 'DOWN') overshoot = (this.y + step) - this.targetY;
                else if (this.dir === 'UP') overshoot = this.targetY - (this.y - step);

                this.x = this.targetX;
                this.y = this.targetY;
                
                this.c = Math.floor(this.x / TILE_SIZE);
                this.r = Math.floor(this.y / TILE_SIZE);

                if (this.c <= 0 && this.dir === 'LEFT') { this.x = canvas.width; this.c = map[0].length - 1; this.targetX = this.x; overshoot = 0; }
                if (this.c >= map[0].length - 1 && this.dir === 'RIGHT') { this.x = 0; this.c = 0; this.targetX = 0; overshoot = 0; }

                if (this.canMove(this.nextDir)) {
                    this.dir = this.nextDir;
                } else if (!this.canMove(this.dir)) {
                    this.dir = null;
                    overshoot = 0;
                }

                if (this.dir) {
                    this.targetX = this.x + DIRS[this.dir].x * TILE_SIZE;
                    this.targetY = this.y + DIRS[this.dir].y * TILE_SIZE;
                    this.angle = DIRS[this.dir].angle;
                    
                    this.x += DIRS[this.dir].x * overshoot;
                    this.y += DIRS[this.dir].y * overshoot;
                }
            } else {
                this.x += DIRS[this.dir].x * step;
                this.y += DIRS[this.dir].y * step;
            }

            // אנימציית פה מתוקנת ונעולה (Clamp)
            this.mouthOpen += 3.5 * (dt / 1000) * this.mouthDir;
            if (this.mouthOpen >= 0.25) {
                this.mouthOpen = 0.25;
                this.mouthDir = -1;
            } else if (this.mouthOpen <= 0) {
                this.mouthOpen = 0;
                this.mouthDir = 1;
            }
        }

        let currentC = Math.floor(this.x / TILE_SIZE);
        let currentR = Math.floor(this.y / TILE_SIZE);
        
        if (map[currentR] && map[currentR][currentC] === 0) {
            map[currentR][currentC] = 2; 
            addScore(10); totalDots--; 
            if(frameCount % 4 === 0) playSound('chomp');
            if (totalDots === 0) levelComplete();
        }

        if (map[currentR] && map[currentR][currentC] === 7) {
            map[currentR][currentC] = 2; 
            addScore(50); totalDots--; 
            frightenedTimer = Math.max(2000, 8000 - (currentLevelIndex * 1000)); 
            ghostEatMultiplier = 200;
            playSound('power');
            
            ghosts.forEach(g => {
                if (g.state !== 'dead') {
                    g.state = 'frightened';
                    if(g.dir) {
                        const opp = Object.keys(DIRS).find(k => DIRS[k].x === -DIRS[g.dir].x && DIRS[k].y === -DIRS[g.dir].y);
                        if(opp) {
                            g.dir = opp;
                            g.targetX = g.c * TILE_SIZE + TILE_SIZE/2;
                            g.targetY = g.r * TILE_SIZE + TILE_SIZE/2;
                        }
                    }
                }
            });
            if (totalDots === 0) levelComplete();
        }

        for (let i = 0; i < apples.length; i++) {
            if (currentR === apples[i].r && currentC === apples[i].c) {
                playSound('fruit'); 
                lives++; 
                addScore(100);
                floatingTexts.push(new FloatingText(this.x, this.y - 10, "+100", "#ff7675"));
                apples.splice(i, 1); 
                break;
            }
        }
    }

    draw() {
        if (this.mouthOpen >= 1) return; 

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.shadowBlur = 15; ctx.shadowColor = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, 0, TILE_SIZE/2 - 2, this.mouthOpen * Math.PI, (2 - this.mouthOpen) * Math.PI);
        ctx.lineTo(0, 0);
        ctx.fillStyle = '#f1c40f'; ctx.fill(); ctx.closePath();
        ctx.restore();
    }
}

class Ghost {
    constructor(r, c, color) {
        this.startR = r; this.startC = c;
        this.color = color;
        this.baseSpeed = 100 + (currentLevelIndex * 15); 
        this.reset();
    }

    reset() {
        this.r = this.startR; this.c = this.startC;
        const center = getCenter(this.r, this.c);
        this.x = center.x; this.y = center.y;
        this.targetX = this.x; this.targetY = this.y;
        this.dir = 'UP';
        this.state = 'normal';
    }

    getValidMoves() {
        const moves = [];
        for (let key in DIRS) {
            if (this.dir && DIRS[key].x === -DIRS[this.dir].x && DIRS[key].y === -DIRS[this.dir].y) continue;
            
            let checkC = this.c + DIRS[key].x;
            let checkR = this.r + DIRS[key].y;
            
            if (checkC < 0) checkC = map[0].length - 1;
            if (checkC >= map[0].length) checkC = 0;
            
            if (map[checkR] && map[checkR][checkC] !== 1) {
                moves.push(key);
            }
        }
        if (moves.length === 0 && this.dir) {
            const opp = Object.keys(DIRS).find(k => DIRS[k].x === -DIRS[this.dir].x && DIRS[k].y === -DIRS[this.dir].y);
            if(opp) moves.push(opp);
        }
        return moves;
    }

    update(dt) {
        if (this.state === 'dead') {
            const targetCenter = getCenter(this.startR, this.startC);
            const dx = targetCenter.x - this.x;
            const dy = targetCenter.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < 5) {
                this.x = targetCenter.x; this.y = targetCenter.y;
                this.c = this.startC; this.r = this.startR;
                this.targetX = this.x; this.targetY = this.y;
                this.state = 'normal'; 
                this.dir = 'UP';
            } else {
                const speed = 400 * (dt / 1000); 
                this.x += (dx / dist) * speed;
                this.y += (dy / dist) * speed;
            }
            return; 
        }

        let currentSpeed = this.baseSpeed;
        if (this.state === 'frightened') currentSpeed *= 0.6;

        if (this.dir) {
            const step = currentSpeed * (dt / 1000);
            let reachedTarget = false;

            if (this.dir === 'RIGHT' && this.x + step >= this.targetX) reachedTarget = true;
            else if (this.dir === 'LEFT' && this.x - step <= this.targetX) reachedTarget = true;
            else if (this.dir === 'DOWN' && this.y + step >= this.targetY) reachedTarget = true;
            else if (this.dir === 'UP' && this.y - step <= this.targetY) reachedTarget = true;

            if (reachedTarget) {
                let overshoot = 0;
                if (this.dir === 'RIGHT') overshoot = (this.x + step) - this.targetX;
                else if (this.dir === 'LEFT') overshoot = this.targetX - (this.x - step);
                else if (this.dir === 'DOWN') overshoot = (this.y + step) - this.targetY;
                else if (this.dir === 'UP') overshoot = this.targetY - (this.y - step);

                this.x = this.targetX;
                this.y = this.targetY;
                this.c = Math.floor(this.x / TILE_SIZE);
                this.r = Math.floor(this.y / TILE_SIZE);

                if (this.c <= 0 && this.dir === 'LEFT') { this.x = canvas.width; this.c = map[0].length - 1; this.targetX = this.x; overshoot = 0; }
                if (this.c >= map[0].length - 1 && this.dir === 'RIGHT') { this.x = 0; this.c = 0; this.targetX = 0; overshoot = 0; }

                const moves = this.getValidMoves();
                
                if (moves.length > 0) {
                    if (this.state === 'frightened') {
                        this.dir = moves[Math.floor(Math.random() * moves.length)];
                    } else if (Math.random() > 0.4 && pacman) {
                        moves.sort((a, b) => {
                            let aDist = Math.hypot((this.c + DIRS[a].x) - pacman.c, (this.r + DIRS[a].y) - pacman.r);
                            let bDist = Math.hypot((this.c + DIRS[b].x) - pacman.c, (this.r + DIRS[b].y) - pacman.r);
                            return aDist - bDist;
                        });
                        this.dir = moves[0];
                    } else {
                        this.dir = moves[Math.floor(Math.random() * moves.length)];
                    }
                    
                    this.targetX = this.x + DIRS[this.dir].x * TILE_SIZE;
                    this.targetY = this.y + DIRS[this.dir].y * TILE_SIZE;
                    
                    this.x += DIRS[this.dir].x * overshoot;
                    this.y += DIRS[this.dir].y * overshoot;
                } else {
                    this.dir = null;
                }
            } else {
                this.x += DIRS[this.dir].x * step;
                this.y += DIRS[this.dir].y * step;
            }
        }

        if (pacman && pacman.state !== 'dying') {
            const dist = Math.hypot(this.x - pacman.x, this.y - pacman.y);
            if (dist < TILE_SIZE / 1.5) {
                if (this.state === 'normal') {
                    initiateDeath();
                } else if (this.state === 'frightened') {
                    playSound('eat_ghost');
                    this.state = 'dead';
                    addScore(ghostEatMultiplier);
                    floatingTexts.push(new FloatingText(this.x, this.y, `+${ghostEatMultiplier}`, "#00ffff"));
                    ghostEatMultiplier *= 2; 
                    freezeTimer = 300; 
                }
            }
        }
    }

    draw() {
        ctx.save();
        
        let drawColor = this.color;
        if (this.state === 'frightened') {
            if (frightenedTimer < 2000 && Math.floor(frameCount / 10) % 2 === 0) {
                drawColor = '#ffffff';
            } else {
                drawColor = '#2980b9'; 
            }
        }

        if (this.state !== 'dead') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = drawColor;
            
            ctx.beginPath();
            const r = TILE_SIZE/2 - 2;
            ctx.arc(this.x, this.y - r/4, r, Math.PI, 0);
            ctx.lineTo(this.x + r, this.y + r);
            
            ctx.lineTo(this.x + r/3, this.y + r - 4);
            ctx.lineTo(this.x, this.y + r);
            ctx.lineTo(this.x - r/3, this.y + r - 4);
            
            ctx.lineTo(this.x - r, this.y + r);
            ctx.fillStyle = drawColor;
            ctx.fill();
            ctx.closePath();
        }

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(this.x - 4, this.y - 4, 3.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x + 4, this.y - 4, 3.5, 0, Math.PI*2); ctx.fill();
        
        let eyeOffsetX = 0, eyeOffsetY = 0;
        if(this.dir && this.state !== 'dead') {
            eyeOffsetX = DIRS[this.dir].x * 1.5;
            eyeOffsetY = DIRS[this.dir].y * 1.5;
        } else if (this.state === 'dead') {
            const dx = getCenter(this.startR, this.startC).x - this.x;
            const dy = getCenter(this.startR, this.startC).y - this.y;
            if (Math.abs(dx) > Math.abs(dy)) eyeOffsetX = dx > 0 ? 1.5 : -1.5;
            else eyeOffsetY = dy > 0 ? 1.5 : -1.5;
        }
        
        ctx.fillStyle = this.state === 'frightened' ? '#f1c40f' : 'blue';
        ctx.beginPath(); ctx.arc(this.x - 4 + eyeOffsetX, this.y - 4 + eyeOffsetY, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x + 4 + eyeOffsetX, this.y - 4 + eyeOffsetY, 1.5, 0, Math.PI*2); ctx.fill();
        
        ctx.restore();
    }
}

// --- פונקציות ניהול מערכת ---

function initMap(levelIndex) {
    const layout = levels[levelIndex % levels.length];
    map = []; totalDots = 0; ghosts = []; apples = []; floatingTexts = [];
    frightenedTimer = 0;

    for (let r = 0; r < layout.length; r++) {
        let row = [];
        for (let c = 0; c < layout[r].length; c++) {
            const val = parseInt(layout[r][c]);
            
            if (val === 5) { 
                pacman = new Pacman(r, c);
                row.push(2);
            } else if (val === 4) { 
                if (ghosts.length < 4) ghosts.push(new Ghost(r, c, GHOST_COLORS[ghosts.length]));
                row.push(2);
            } else if (val === 6) { 
                apples.push({r, c});
                row.push(2);
            } else {
                row.push(val);
                if (val === 0 || val === 7) totalDots++;
            }
        }
        map.push(row);
    }
}

function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const wallColor = LEVEL_COLORS[currentLevelIndex % LEVEL_COLORS.length];
    
    for (let r = 0; r < map.length; r++) {
        for (let c = 0; c < map[r].length; c++) {
            if (map[r][c] === 1) { 
                ctx.shadowBlur = 8;
                ctx.shadowColor = wallColor;
                ctx.strokeStyle = wallColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(c * TILE_SIZE + 2, r * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                ctx.shadowBlur = 0;
            } else if (map[r][c] === 3) { 
                ctx.fillStyle = '#e74c3c'; 
                ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE + TILE_SIZE/2 - 2, TILE_SIZE, 4);
            } else if (map[r][c] === 0) { 
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.arc(c * TILE_SIZE + TILE_SIZE/2, r * TILE_SIZE + TILE_SIZE/2, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();
            } else if (map[r][c] === 7) {
                let pulse = Math.sin(frameCount * 0.1) * 2 + 6;
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#f1c40f';
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.arc(c * TILE_SIZE + TILE_SIZE/2, r * TILE_SIZE + TILE_SIZE/2, pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();
                ctx.shadowBlur = 0;
            }
        }
    }

    for (let apple of apples) {
        ctx.font = "20px Arial";
        ctx.fillText("🍎", apple.c * TILE_SIZE + 5, apple.r * TILE_SIZE + 22);
    }
}

function addScore(points) {
    score += points;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('pacmanHighScore', highScore);
    }
    updateUI();
}

function updateUI() {
    document.getElementById('scoreDisplay').textContent = score;
    document.getElementById('levelDisplay').textContent = currentLevelIndex + 1;
    document.getElementById('livesDisplay').textContent = '❤️'.repeat(Math.max(0, lives));
    
    let hsDisplay = document.getElementById('highScoreDisplay');
    if (!hsDisplay) {
        const statsBar = document.querySelector('.game-stats');
        if (statsBar) {
            statsBar.innerHTML += `<div>שיא: <span id="highScoreDisplay">${highScore}</span></div>`;
        }
    } else {
        hsDisplay.textContent = highScore;
    }
}

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let dt = timestamp - lastTime;
    lastTime = timestamp;
    
    if (dt > 50) dt = 50; 

    frameCount++;
    
    if (freezeTimer > 0) {
        freezeTimer -= dt;
        drawMap();
        if (pacman) pacman.draw();
        ghosts.forEach(g => g.draw());
        floatingTexts.forEach(ft => ft.draw());
        animationId = requestAnimationFrame(gameLoop);
        return;
    }

    if (frightenedTimer > 0) {
        frightenedTimer -= dt;
        if (frightenedTimer <= 0) {
            frightenedTimer = 0;
            ghosts.forEach(g => { if(g.state === 'frightened') g.state = 'normal'; });
        }
    }

    drawMap();
    
    if (pacman) {
        pacman.update(dt);
        pacman.draw();
    }
    
    if (pacman && pacman.state !== 'dying') {
        ghosts.forEach(g => {
            g.update(dt);
            g.draw();
        });
    } else {
        ghosts.forEach(g => g.draw());
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update(dt);
        floatingTexts[i].draw();
        if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }

    if (pacman && pacman.state === 'dying' && pacman.mouthOpen >= 1) {
        handleDeath();
        return; 
    }

    animationId = requestAnimationFrame(gameLoop);
}

function initiateDeath() {
    playSound('death');
    pacman.state = 'dying';
    pacman.mouthOpen = 0; 
}

function handleDeath() {
    cancelAnimationFrame(animationId);
    animationId = null;
    
    lives--;
    updateUI();

    if (lives <= 0) {
        showOverlay("נפסלת! המשחק נגמר", `הגעת לניקוד: ${score}`, "התחל משחק חדש");
    } else {
        pacman.reset();
        ghosts.forEach(g => g.reset());
        frightenedTimer = 0;
        floatingTexts = [];
        
        setTimeout(() => {
            lastTime = 0;
            if(!animationId) animationId = requestAnimationFrame(gameLoop);
        }, 1000);
    }
}

function levelComplete() {
    cancelAnimationFrame(animationId);
    animationId = null;
    currentLevelIndex++;
    showOverlay("כל הכבוד!", `סיימת את שלב ${currentLevelIndex}`, "לשלב הבא");
}

function showOverlay(title, text, btnText) {
    document.getElementById('overlay-title').textContent = title;
    document.getElementById('overlay-text').textContent = text;
    document.getElementById('overlay-btn').textContent = btnText;
    document.getElementById('overlay').style.display = 'flex';
}

function startLevel() {
    document.getElementById('overlay').style.display = 'none';
    if(animationId) cancelAnimationFrame(animationId);
    
    if (lives <= 0) {
        currentLevelIndex = 0;
        score = 0;
        lives = 3;
    }

    initMap(currentLevelIndex);
    updateUI(); 
    lastTime = 0;
    animationId = requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
    if (!pacman || pacman.state === 'dying') return;
    
    if(audioCtx.state === 'suspended') audioCtx.resume();

    if (e.key === 'ArrowUp') pacman.nextDir = 'UP';
    else if (e.key === 'ArrowDown') pacman.nextDir = 'DOWN';
    else if (e.key === 'ArrowLeft') pacman.nextDir = 'LEFT';
    else if (e.key === 'ArrowRight') pacman.nextDir = 'RIGHT';
});

startLevel();