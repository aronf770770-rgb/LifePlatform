// modules/games/sub_games/chess/chess.js

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const THEME = "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/";
const PIECES = {
    'P': { img: THEME+'wp.png', color: 'w', type: 'p', val: 100 },
    'N': { img: THEME+'wn.png', color: 'w', type: 'n', val: 320 },
    'B': { img: THEME+'wb.png', color: 'w', type: 'b', val: 330 },
    'R': { img: THEME+'wr.png', color: 'w', type: 'r', val: 500 },
    'Q': { img: THEME+'wq.png', color: 'w', type: 'q', val: 900 },
    'K': { img: THEME+'wk.png', color: 'w', type: 'k', val: 20000 },
    'p': { img: THEME+'bp.png', color: 'b', type: 'p', val: -100 },
    'n': { img: THEME+'bn.png', color: 'b', type: 'n', val: -320 },
    'b': { img: THEME+'bb.png', color: 'b', type: 'b', val: -330 },
    'r': { img: THEME+'br.png', color: 'b', type: 'r', val: -500 },
    'q': { img: THEME+'bq.png', color: 'b', type: 'q', val: -900 },
    'k': { img: THEME+'bk.png', color: 'b', type: 'k', val: -20000 }
};

let gameState = { board: [], turn: 'w', castling: {}, epSquare: null, history: [] };
let gameStats = { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
let currentMode = 'play'; 
let gameSettings = { mode: 'pvp', playerColor: 'w', level: 2, autoFlip: false, timeControl: '10' };
let isAnalysisMode = true;
let isComputerThinking = false;
let isGameOver = false; 
let moveNotationList = [];

// מערכת שעון
let timerInterval = null;
let timeW = 600, timeB = 600;
let timeIncrement = 0;
let isClockRunning = false;

// פאזלים
let puzzleRating = 1200;
let currentPuzzle = null;
let puzzleMoveIndex = 0;

let draggedPiece = null;
let sourceSquare = null;
let selectedSquare = null;
let lastMoveSquares = { start: null, end: null };
let promotionCallback = null;

const chessboardElement = document.getElementById('chessboard');

/* ================== אתחול ================== */
function initGame() {
    loadFEN(START_FEN);
    lastMoveSquares = { start: null, end: null };
    gameState.history = [];
    moveNotationList = [];
    gameStats = { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
    isComputerThinking = false;
    isGameOver = false;
    document.getElementById('game-over-modal').style.display = 'none';
    
    updateSettings();
    initClock();
    renderBoardUI();
    updateUI(false);
    
    if (gameSettings.mode === 'pvc' && gameSettings.playerColor === 'b' && gameState.turn === 'w') {
        isComputerThinking = true;
        setTimeout(makeComputerMove, 600);
    }
}

function updateSettings() {
    const modeInputs = document.getElementsByName('gameMode');
    modeInputs.forEach(radio => { if(radio.checked) gameSettings.mode = radio.value; });
    
    gameSettings.playerColor = document.getElementById('player-color').value;
    gameSettings.level = parseInt(document.getElementById('engine-level').value);
    gameSettings.autoFlip = document.getElementById('auto-flip').checked;
    
    const timeVal = document.getElementById('time-control').value;
    if(timeVal !== gameSettings.timeControl) {
        gameSettings.timeControl = timeVal;
        initClock(); 
    }

    document.getElementById('computer-settings').style.display = gameSettings.mode === 'pvc' ? 'block' : 'none';
    document.getElementById('pvp-settings').style.display = gameSettings.mode === 'pvp' ? 'block' : 'none';

    handleBoardFlip();
}

function toggleAnalysis() {
    isAnalysisMode = document.getElementById('analysis-toggle').checked;
    document.getElementById('eval-bar-container').style.display = (currentMode === 'play' && isAnalysisMode) ? 'block' : 'none';
    updateUI(false);
}

/* ================== מערכת שעון ================== */
function initClock() {
    clearInterval(timerInterval);
    isClockRunning = false;
    timeIncrement = 0;
    
    if (gameSettings.timeControl === 'unlimited' || currentMode === 'puzzles') {
        timeW = Infinity; timeB = Infinity;
        document.getElementById('top-clock').style.display = 'none';
        document.getElementById('bottom-clock').style.display = 'none';
        return;
    }

    document.getElementById('top-clock').style.display = 'block';
    document.getElementById('bottom-clock').style.display = 'block';

    if (gameSettings.timeControl === '3+2') { timeW = 180; timeB = 180; timeIncrement = 2; }
    else { timeW = parseInt(gameSettings.timeControl) * 60; timeB = parseInt(gameSettings.timeControl) * 60; }
    
    renderClocks();
}

function startClock() {
    if (timeW === Infinity || isClockRunning || currentMode === 'puzzles' || isGameOver) return;
    isClockRunning = true;
    timerInterval = setInterval(() => {
        if (gameState.turn === 'w') {
            timeW--; if (timeW <= 0) { timeW = 0; handleGameOver('black_time'); }
        } else {
            timeB--; if (timeB <= 0) { timeB = 0; handleGameOver('white_time'); }
        }
        renderClocks();
    }, 1000);
}

function renderClocks() {
    if (timeW === Infinity) return;
    
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const isFlipped = chessboardElement.classList.contains('flipped');
    const bottomTime = isFlipped ? timeB : timeW;
    const topTime = isFlipped ? timeW : timeB;
    const bottomIsActive = isFlipped ? (gameState.turn === 'b') : (gameState.turn === 'w');

    const topEl = document.getElementById('top-clock');
    const botEl = document.getElementById('bottom-clock');
    
    topEl.textContent = formatTime(topTime);
    botEl.textContent = formatTime(bottomTime);
    
    topEl.className = 'chess-clock' + (!bottomIsActive && !isGameOver ? ' active-clock' : '') + (topTime <= 10 ? ' low-time' : '');
    botEl.className = 'chess-clock' + (bottomIsActive && !isGameOver ? ' active-clock' : '') + (bottomTime <= 10 ? ' low-time' : '');
}

/* ================== תצוגה והיפוך לוח ================== */
function handleBoardFlip() {
    if (currentMode === 'puzzles') {
        chessboardElement.classList.toggle('flipped', currentPuzzle && currentPuzzle.turn === 'b');
    } else if (gameSettings.mode === 'pvc') {
        chessboardElement.classList.toggle('flipped', gameSettings.playerColor === 'b');
    } else if (gameSettings.autoFlip) {
        chessboardElement.classList.toggle('flipped', gameState.turn === 'b');
    } else {
        chessboardElement.classList.remove('flipped');
    }
    renderClocks();
    updateCapturedMaterial();
}

function switchMode(mode) {
    currentMode = mode;
    document.getElementById('tab-play').classList.toggle('active', mode === 'play');
    document.getElementById('tab-puzzles').classList.toggle('active', mode === 'puzzles');
    document.getElementById('sidebar-play').style.display = mode === 'play' ? 'flex' : 'none';
    document.getElementById('sidebar-puzzles').style.display = mode === 'puzzles' ? 'flex' : 'none';
    document.getElementById('eval-bar-container').style.display = (mode === 'play' && isAnalysisMode) ? 'block' : 'none';
    
    if (mode === 'puzzles') loadNextPuzzle(); else initGame();
}

function loadFEN(fen) {
    const parts = fen.split(' ');
    gameState.board = Array(8).fill().map(() => Array(8).fill(''));
    const rows = parts[0].split('/');
    for (let r = 0; r < 8; r++) {
        let col = 0;
        for (let char of rows[r]) {
            if (!isNaN(char)) { for (let i = 0; i < parseInt(char); i++) gameState.board[r][col++] = ''; } 
            else { gameState.board[r][col++] = char; }
        }
    }
    gameState.turn = parts[1];
    gameState.castling = { K: parts[2].includes('K'), Q: parts[2].includes('Q'), k: parts[2].includes('k'), q: parts[2].includes('q') };
    gameState.epSquare = parts[3] !== '-' ? { r: 8 - parseInt(parts[3][1]), c: parts[3].charCodeAt(0) - 97 } : null;
}

function cloneState(st) {
    return {
        board: st.board.map(r => [...r]), turn: st.turn,
        castling: { ...st.castling }, epSquare: st.epSquare ? { ...st.epSquare } : null,
        timeW: timeW, timeB: timeB,
        history: [] 
    };
}

function lightClone(st) {
    return {
        board: [
            [...st.board[0]], [...st.board[1]], [...st.board[2]], [...st.board[3]],
            [...st.board[4]], [...st.board[5]], [...st.board[6]], [...st.board[7]]
        ],
        turn: st.turn,
        castling: { ...st.castling },
        epSquare: st.epSquare ? { ...st.epSquare } : null
    };
}

function renderBoardUI() {
    chessboardElement.innerHTML = '';
    const colsStr = "abcdefgh";
    const inCheck = isInCheck(gameState.board, gameState.turn);
    const kingSq = inCheck ? findKing(gameState.board, gameState.turn) : null;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const sq = document.createElement('div');
            sq.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
            sq.dataset.row = r; sq.dataset.col = c;
            
            sq.setAttribute('data-row-label', 8 - r);
            sq.setAttribute('data-col-label', colsStr[c]);

            if (lastMoveSquares.start && lastMoveSquares.start.r === r && lastMoveSquares.start.c === c) sq.classList.add('last-move');
            if (lastMoveSquares.end && lastMoveSquares.end.r === r && lastMoveSquares.end.c === c) sq.classList.add('last-move');
            if (kingSq && kingSq.r === r && kingSq.c === c) sq.classList.add('in-check');

            sq.addEventListener('dragover', e => e.preventDefault());
            sq.addEventListener('drop', handleDrop);
            sq.addEventListener('click', handleSquareClick);

            const p = gameState.board[r][c];
            if (p !== '') {
                const pieceDiv = document.createElement('div');
                pieceDiv.className = 'piece';
                pieceDiv.style.backgroundImage = `url(${PIECES[p].img})`;
                pieceDiv.draggable = true;
                pieceDiv.addEventListener('dragstart', handleDragStart);
                pieceDiv.addEventListener('dragend', handleDragEnd);
                sq.appendChild(pieceDiv);
            }
            chessboardElement.appendChild(sq);
        }
    }
}

/* ================== אינטראקצית תנועה ================== */
function handleSquareClick(e) {
    if (isComputerThinking || isGameOver) return;
    let t = e.target;
    if (t.classList.contains('piece')) t = t.parentElement;
    const r = parseInt(t.dataset.row), c = parseInt(t.dataset.col);

    if (selectedSquare) {
        const sr = parseInt(selectedSquare.dataset.row), sc = parseInt(selectedSquare.dataset.col);
        if (attemptMove(sr, sc, r, c)) { selectedSquare = null; return; }
    }

    clearHighlights();
    const p = gameState.board[r][c];
    if (p !== '' && PIECES[p].color === gameState.turn) {
        if (currentMode === 'play' && gameSettings.mode === 'pvc' && gameState.turn !== gameSettings.playerColor) return;
        selectedSquare = t; t.classList.add('selected-square'); showValidMovesUI(r, c);
    } else selectedSquare = null;
}

function handleDragStart(e) {
    if (isComputerThinking || isGameOver) { e.preventDefault(); return; }
    const sq = e.target.parentElement;
    const p = gameState.board[sq.dataset.row][sq.dataset.col];
    if (PIECES[p].color !== gameState.turn || (currentMode === 'play' && gameSettings.mode === 'pvc' && gameState.turn !== gameSettings.playerColor)) { e.preventDefault(); return; }

    draggedPiece = e.target; sourceSquare = sq;
    setTimeout(() => e.target.style.opacity = '0.5', 0);
    handleSquareClick({ target: sourceSquare });
}

function handleDragEnd(e) { if(e.target) e.target.style.opacity = '1'; draggedPiece = null; sourceSquare = null; }
function handleDrop(e) {
    e.preventDefault(); if (!draggedPiece || isGameOver) return;
    let t = e.target; if (t.classList.contains('piece')) t = t.parentElement;
    attemptMove(parseInt(sourceSquare.dataset.row), parseInt(sourceSquare.dataset.col), parseInt(t.dataset.row), parseInt(t.dataset.col));
    selectedSquare = null;
}

function showValidMovesUI(r, c) {
    const moves = getLegalMoves(gameState);
    moves.filter(m => m.r1 === r && m.c1 === c).forEach(m => {
        const sq = document.querySelector(`.square[data-row="${m.r2}"][data-col="${m.c2}"]`);
        if (sq) {
            sq.classList.add('highlight-move');
            if (gameState.board[m.r2][m.c2] !== '' || m.ep) sq.classList.add('capture-move');
        }
    });
}
function clearHighlights() {
    document.querySelectorAll('.highlight-move, .capture-move, .selected-square').forEach(el => {
        el.classList.remove('highlight-move', 'capture-move', 'selected-square');
    });
}

function attemptMove(r1, c1, r2, c2) {
    const moves = getLegalMoves(gameState);
    const move = moves.find(m => m.r1 === r1 && m.c1 === c1 && m.r2 === r2 && m.c2 === c2);
    if (!move) return false;

    if (move.promo) {
        document.getElementById('promotion-modal').style.display = 'flex';
        promotionCallback = (promoPiece) => {
            document.getElementById('promotion-modal').style.display = 'none';
            move.promo = gameState.turn === 'w' ? promoPiece.toUpperCase() : promoPiece;
            processMoveSequence(move, true);
        };
        return true;
    }
    processMoveSequence(move, true);
    return true;
}

/* ================== ביצוע מהלך מלא ================== */
function processMoveSequence(move, isPlayer) {
    clearHighlights();
    if (!isClockRunning && currentMode === 'play') startClock();
    
    if (currentMode === 'puzzles') { handlePuzzleMove(move); return; }

    const notation = getAlgebraicNotation(gameState, move);
    if(gameState.turn === 'w') moveNotationList.push([notation]);
    else moveNotationList[moveNotationList.length-1].push(notation);

    // חישוב איכות מהלך (עכשיו משתמש ב-Minimax כדי לראות את ההשלכות האמיתיות)
    let moveQuality = null;
    if (isAnalysisMode && isPlayer) {
        // מה היה המצב לפני המהלך (חישוב עומק 2)
        const evalBefore = getBestEval(gameState, 2, -Infinity, Infinity);
        
        // מה המצב אחרי המהלך (חישוב עומק 2)
        const simState = lightClone(gameState);
        applyMove(simState, move);
        const evalAfter = getBestEval(simState, 2, -Infinity, Infinity);
        
        moveQuality = calculateMoveQuality(evalBefore, evalAfter, gameState.turn);
        
        // עדכון סטטיסטיקות
        if (moveQuality) {
            if (moveQuality.key === 'best') gameStats.best++;
            else if (moveQuality.key === 'excellent') gameStats.excellent++;
            else if (moveQuality.key === 'good') gameStats.good++;
            else if (moveQuality.key === 'inaccuracy') gameStats.inaccuracy++;
            else if (moveQuality.key === 'mistake') gameStats.mistake++;
            else if (moveQuality.key === 'blunder') gameStats.blunder++;
        }
    }

    gameState.history.push(cloneState(gameState));
    if (gameState.turn === 'w') timeW += timeIncrement; else timeB += timeIncrement;

    applyMove(gameState, move);
    lastMoveSquares = { start: {r: move.r1, c: move.c1}, end: {r: move.r2, c: move.c2} };
    
    handleBoardFlip();
    renderBoardUI();
    updateUI(isPlayer, moveQuality);

    // בדיקת סיום משחק (מט או פט)
    const nextMoves = getLegalMoves(gameState);
    if (nextMoves.length === 0) {
        isGameOver = true;
        clearInterval(timerInterval);
        isClockRunning = false;
        const isCheck = isInCheck(gameState.board, gameState.turn);
        handleGameOver(isCheck ? (gameState.turn === 'w' ? 'black' : 'white') : 'draw');
        return;
    }

    // תור המחשב
    if (gameSettings.mode === 'pvc' && gameState.turn !== gameSettings.playerColor && !isComputerThinking && !isGameOver) {
        isComputerThinking = true;
        setTimeout(makeComputerMove, 250); 
    }
}

function undoMove() {
    if (isComputerThinking || gameState.history.length === 0) return;
    let steps = (gameSettings.mode === 'pvc' && gameState.history.length >= 2) ? 2 : 1;
    
    for(let i=0; i<steps; i++) {
        if(gameState.history.length > 0) {
            const prevState = gameState.history.pop();
            if(prevState.turn === 'b') moveNotationList[moveNotationList.length-1].pop();
            else moveNotationList.pop();
            
            gameState = prevState;
            timeW = gameState.timeW; timeB = gameState.timeB;
        }
    }
    
    isGameOver = false;
    lastMoveSquares = { start: null, end: null };
    clearHighlights(); handleBoardFlip(); renderBoardUI(); updateUI(false);
}

/* ================== רישום מהלכים & Material ================== */
function getAlgebraicNotation(st, move) {
    if (move.castling === 'K') return "O-O";
    if (move.castling === 'Q') return "O-O-O";
    
    const p = st.board[move.r1][move.c1];
    const type = PIECES[p].type;
    const isCapture = st.board[move.r2][move.c2] !== '' || move.ep;
    
    const cols = "abcdefgh";
    let text = "";
    
    if (type !== 'p') text += type.toUpperCase();
    else if (isCapture) text += cols[move.c1];
    
    if (isCapture) text += "x";
    text += cols[move.c2] + (8 - move.r2);
    if (move.promo) text += "=" + move.promo.toUpperCase();
    
    const sim = lightClone(st);
    applyMove(sim, move);
    if (isInCheck(sim.board, sim.turn)) {
        if (getLegalMoves(sim).length === 0) text += "#"; else text += "+";
    }
    return text;
}

function renderMoveList() {
    const listEl = document.getElementById('move-list');
    listEl.innerHTML = '';
    moveNotationList.forEach((pair, index) => {
        listEl.innerHTML += `<div class="move-number">${index + 1}</div>`;
        listEl.innerHTML += `<div class="move-text">${pair[0]}</div>`;
        listEl.innerHTML += `<div class="move-text">${pair[1] || ''}</div>`;
    });
    listEl.scrollTop = listEl.scrollHeight;
}

function updateCapturedMaterial() {
    const startCounts = { p:8, n:2, b:2, r:2, q:1 };
    let curW = { p:0, n:0, b:0, r:0, q:0 }, curB = { p:0, n:0, b:0, r:0, q:0 };
    let scoreW = 0, scoreB = 0;
    
    for (let r=0; r<8; r++) {
        for (let c=0; c<8; c++) {
            const p = gameState.board[r][c];
            if(p!=='') {
                const info = PIECES[p];
                if(info.type !== 'k') {
                    if(info.color === 'w') { curW[info.type]++; scoreW += Math.abs(info.val); }
                    else { curB[info.type]++; scoreB += Math.abs(info.val); }
                }
            }
        }
    }
    
    let wCapturedHtml = '', bCapturedHtml = '';
    const order = ['q','r','b','n','p'];
    
    order.forEach(type => {
        let missingW = startCounts[type] - curW[type];
        for(let i=0; i<missingW; i++) wCapturedHtml += `<img src="${PIECES[type.toUpperCase()].img}">`;
        
        let missingB = startCounts[type] - curB[type];
        for(let i=0; i<missingB; i++) bCapturedHtml += `<img src="${PIECES[type].img}">`;
    });

    const diff = scoreW - scoreB;
    if (diff > 0) wCapturedHtml += `<span style="margin-left:5px;">+${diff/100}</span>`;
    else if (diff < 0) bCapturedHtml += `<span style="margin-left:5px;">+${Math.abs(diff)/100}</span>`;

    const isFlipped = chessboardElement.classList.contains('flipped');
    document.getElementById('top-material').innerHTML = isFlipped ? wCapturedHtml : bCapturedHtml;
    document.getElementById('bottom-material').innerHTML = isFlipped ? bCapturedHtml : wCapturedHtml;
}

/* ================== חוקים, חידות ומנוע מחשב ================== */

// פונקציית עזר לתרגום משבצות (למשל "e4") לקואורדינטות
function parseMove(sq1, sq2, promo = null) {
    return {
        r1: 8 - parseInt(sq1[1]), c1: sq1.charCodeAt(0) - 97,
        r2: 8 - parseInt(sq2[1]), c2: sq2.charCodeAt(0) - 97,
        promo: promo
    };
}

// מאגר חידות קלאסיות ומוכחות
const puzzleTemplates = [
    // 1. מט שורה אחרונה (לבן)
    { fen: "6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1", moves: [parseMove("d1", "d8")] }, 
    // 2. מט סנדלרים (לבן)
    { fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1", moves: [parseMove("h5", "f7")] }, 
    // 3. מט טיפשים (שחור)
    { fen: "rnbqkbnr/pppp1ppp/8/4p3/5PP1/8/PPPPP2P/RNBQKBNR b KQkq - 0 1", moves: [parseMove("d8", "h4")] }, 
    // 4. מזלג סוס (לבן)
    { fen: "2q3k1/8/8/8/3N4/8/8/6K1 w - - 0 1", moves: [parseMove("d4", "e6")] }, 
    // 5. התקפת חשיפה (לבן)
    { fen: "r4rk1/pp3ppp/2n5/3p4/3P2n1/2NB1N1q/PP3P2/R2QR1K1 w - - 0 1", moves: [parseMove("d3", "h7"), parseMove("g8", "h8"), parseMove("h7", "f5")] },
    // 6. מט ב-1 (שחור)
    { fen: "r1b2rk1/pppp1ppp/8/8/2B1P1n1/2N2Q2/PPPP2Pq/R1B2K2 b - - 0 1", moves: [parseMove("h2", "h1")] }
];

function loadNextPuzzle() {
    clearInterval(timerInterval); isClockRunning = false; isGameOver = false;
    const puz = puzzleTemplates[Math.floor(Math.random() * puzzleTemplates.length)];
    loadFEN(puz.fen); currentPuzzle = { ...puz, turn: gameState.turn }; puzzleMoveIndex = 0;
    
    document.getElementById('puzzle-instruction').textContent = gameState.turn === 'w' ? 'תור הלבן למצוא את המהלך!' : 'תור השחור למצוא את המהלך!';
    document.getElementById('puzzle-feedback').textContent = '';
    lastMoveSquares = { start: null, end: null };
    handleBoardFlip(); renderBoardUI(); updateCapturedMaterial();
}

function handlePuzzleMove(move) {
    const expectedMove = currentPuzzle.moves[puzzleMoveIndex];
    if (move.r1 === expectedMove.r1 && move.c1 === expectedMove.c1 && move.r2 === expectedMove.r2 && move.c2 === expectedMove.c2) {
        applyMove(gameState, move);
        lastMoveSquares = { start: {r: move.r1, c: move.c1}, end: {r: move.r2, c: move.c2} };
        renderBoardUI(); updateCapturedMaterial();
        
        puzzleMoveIndex++;
        if (puzzleMoveIndex >= currentPuzzle.moves.length) {
            puzzleRating += 15;
            document.getElementById('puzzle-rating-display').textContent = `מד כושר: ${puzzleRating}`;
            document.getElementById('puzzle-feedback').textContent = "מעולה! פתרת את החידה.";
            document.getElementById('puzzle-feedback').style.color = "var(--success-color)";
            setTimeout(loadNextPuzzle, 1500);
        } else {
            document.getElementById('puzzle-feedback').textContent = "נכון! המחשב מגיב...";
            document.getElementById('puzzle-feedback').style.color = "var(--accent-color)";
            
            // תגובת המחשב בחידה
            setTimeout(() => {
                const oppMove = currentPuzzle.moves[puzzleMoveIndex];
                applyMove(gameState, oppMove);
                lastMoveSquares = { start: {r: oppMove.r1, c: oppMove.c1}, end: {r: oppMove.r2, c: oppMove.c2} };
                puzzleMoveIndex++; 
                renderBoardUI(); 
                updateCapturedMaterial();
                document.getElementById('puzzle-feedback').textContent = "המשך...";
            }, 800);
        }
    } else {
        puzzleRating = Math.max(400, puzzleRating - 10);
        document.getElementById('puzzle-rating-display').textContent = `מד כושר: ${puzzleRating}`;
        document.getElementById('puzzle-feedback').textContent = "טעות, נסה שוב.";
        document.getElementById('puzzle-feedback').style.color = "var(--danger-color)";
        setTimeout(() => { loadFEN(currentPuzzle.fen); renderBoardUI(); updateCapturedMaterial(); }, 1000);
    }
}

function findKing(board, color) {
    const k = color === 'w' ? 'K' : 'k';
    for (let r=0; r<8; r++) for (let c=0; c<8; c++) if (board[r][c] === k) return {r, c};
    return null;
}

function isAttacked(board, r, c, attackerColor) {
    const dirs = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
    for (let i=0; i<8; i++) {
        let step = 1;
        while(true) {
            const nr = r + dirs[i][0]*step, nc = c + dirs[i][1]*step;
            if (nr<0||nr>7||nc<0||nc>7) break;
            const p = board[nr][nc];
            if (p !== '') {
                if (PIECES[p].color === attackerColor) {
                    const pt = PIECES[p].type;
                    const isDiag = (i===0||i===2||i===5||i===7);
                    const isStraight = (i===1||i===3||i===4||i===6);
                    if (pt === 'q' || (pt === 'b' && isDiag) || (pt === 'r' && isStraight) || (pt === 'k' && step === 1)) return true;
                }
                break;
            }
            step++;
        }
    }
    const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (let m of knightMoves) {
        const nr = r+m[0], nc = c+m[1];
        if (nr>=0&&nr<=7&&nc>=0&&nc<=7) {
            const p = board[nr][nc];
            if (p!=='' && PIECES[p].color===attackerColor && PIECES[p].type==='n') return true;
        }
    }
    const pawnDir = attackerColor === 'w' ? 1 : -1; 
    const opPawn = attackerColor === 'w' ? 'P' : 'p';
    if (r+pawnDir>=0 && r+pawnDir<=7) {
        if (c-1>=0 && board[r+pawnDir][c-1] === opPawn) return true;
        if (c+1<=7 && board[r+pawnDir][c+1] === opPawn) return true;
    }
    return false;
}

function isInCheck(board, color) {
    const k = findKing(board, color);
    if (!k) return false;
    return isAttacked(board, k.r, k.c, color === 'w' ? 'b' : 'w');
}

function getPseudoMoves(st, color) {
    const moves = [];
    const b = st.board; const op = color === 'w' ? 'b' : 'w';
    const dir = color === 'w' ? -1 : 1; const startRank = color === 'w' ? 6 : 1; const promRank = color === 'w' ? 0 : 7;
    for (let r=0; r<8; r++) {
        for (let c=0; c<8; c++) {
            const p = b[r][c]; if (p==='' || PIECES[p].color !== color) continue;
            const pt = PIECES[p].type;
            if (pt === 'p') {
                if (b[r+dir][c] === '') {
                    moves.push({r1:r, c1:c, r2:r+dir, c2:c, promo: (r+dir===promRank)});
                    if (r === startRank && b[r+dir*2][c] === '') moves.push({r1:r, c1:c, r2:r+dir*2, c2:c});
                }
                for (let dc of [-1, 1]) {
                    if (c+dc>=0 && c+dc<=7) {
                        if (b[r+dir][c+dc] !== '' && PIECES[b[r+dir][c+dc]].color === op) moves.push({r1:r, c1:c, r2:r+dir, c2:c+dc, promo: (r+dir===promRank)});
                        if (st.epSquare && st.epSquare.r === r+dir && st.epSquare.c === c+dc) moves.push({r1:r, c1:c, r2:r+dir, c2:c+dc, ep: true});
                    }
                }
            } else {
                const isSlider = (pt==='r'||pt==='b'||pt==='q');
                const pDirs = (pt==='r') ? [[-1,0],[1,0],[0,-1],[0,1]] : (pt==='b') ? [[-1,-1],[-1,1],[1,-1],[1,1]] :
                              (pt==='q' || pt==='k') ? [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]] : [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
                for (let d of pDirs) {
                    let step = 1;
                    while (true) {
                        const nr = r + d[0]*step, nc = c + d[1]*step;
                        if (nr<0||nr>7||nc<0||nc>7) break;
                        const target = b[nr][nc];
                        if (target === '') moves.push({r1:r, c1:c, r2:nr, c2:nc}); else {
                            if (PIECES[target].color === op) moves.push({r1:r, c1:c, r2:nr, c2:nc});
                            break;
                        }
                        if (!isSlider) break; 
                        step++;
                    }
                }
            }
        }
    }
    if (!isInCheck(b, color)) {
        const row = color === 'w' ? 7 : 0;
        const kCast = color === 'w' ? st.castling.K : st.castling.k; const qCast = color === 'w' ? st.castling.Q : st.castling.q;
        if (kCast && b[row][5] === '' && b[row][6] === '') if (!isAttacked(b, row, 5, op) && !isAttacked(b, row, 6, op)) moves.push({r1:row, c1:4, r2:row, c2:6, castling:'K'});
        if (qCast && b[row][3] === '' && b[row][2] === '' && b[row][1] === '') if (!isAttacked(b, row, 3, op) && !isAttacked(b, row, 2, op)) moves.push({r1:row, c1:4, r2:row, c2:2, castling:'Q'});
    }
    return moves;
}

function getLegalMoves(st) {
    const pseudo = getPseudoMoves(st, st.turn); const legal = [];
    for (let m of pseudo) {
        const clone = lightClone(st); applyMove(clone, m);
        if (!isInCheck(clone.board, st.turn)) legal.push(m);
    }
    return legal;
}

function applyMove(st, m) {
    const p = st.board[m.r1][m.c1];
    st.board[m.r2][m.c2] = m.promo ? m.promo : p;
    st.board[m.r1][m.c1] = '';
    if (m.ep) st.board[m.r1][m.c2] = '';
    if (m.castling === 'K') { st.board[m.r2][5] = st.board[m.r2][7]; st.board[m.r2][7] = ''; }
    if (m.castling === 'Q') { st.board[m.r2][3] = st.board[m.r2][0]; st.board[m.r2][0] = ''; }

    if (PIECES[p].type === 'p' && Math.abs(m.r2 - m.r1) === 2) st.epSquare = { r: (m.r1 + m.r2) / 2, c: m.c1 }; else st.epSquare = null;

    if (p === 'K') { st.castling.K = false; st.castling.Q = false; }
    if (p === 'k') { st.castling.k = false; st.castling.q = false; }
    if (p === 'R' && m.c1 === 0) st.castling.Q = false;
    if (p === 'R' && m.c1 === 7) st.castling.K = false;
    if (p === 'r' && m.c1 === 0) st.castling.q = false;
    if (p === 'r' && m.c1 === 7) st.castling.k = false;

    st.turn = st.turn === 'w' ? 'b' : 'w';
}

function evaluatePosition(st) {
    let score = 0;
    for (let r=0; r<8; r++) {
        for (let c=0; c<8; c++) {
            const p = st.board[r][c];
            if (p !== '') { 
                const info = PIECES[p];
                let val = info.val;
                
                if (info.type !== 'k' && info.type !== 'r') {
                    if ((r===3||r===4) && (c===3||c===4)) val += (info.color==='w'? 30 : -30);
                    else if ((r>=2&&r<=5) && (c>=2&&c<=5)) val += (info.color==='w'? 10 : -10);
                }
                
                if (info.type === 'p') {
                    if (info.color === 'w') val += (6 - r) * 10;
                    else val -= (r - 1) * 10;
                }
                
                score += val; 
            }
        }
    }
    return score; 
}

function getBestEval(st, depth, alpha, beta) {
    if (depth === 0) return evaluatePosition(st);
    const moves = getLegalMoves(st);
    if (moves.length === 0) return isInCheck(st.board, st.turn) ? (st.turn === 'w' ? -99999 : 99999) : 0; 

    moves.sort((a,b) => (st.board[b.r2][b.c2]!=='' ? 1:0) - (st.board[a.r2][a.c2]!=='' ? 1:0));

    if (st.turn === 'w') {
        let maxEval = -Infinity;
        for (let m of moves) {
            let clone = lightClone(st); 
            if (m.promo) m.promo = 'Q';
            applyMove(clone, m);
            let ev = getBestEval(clone, depth - 1, alpha, beta);
            maxEval = Math.max(maxEval, ev); alpha = Math.max(alpha, ev); if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let m of moves) {
            let clone = lightClone(st); 
            if (m.promo) m.promo = 'q';
            applyMove(clone, m);
            let ev = getBestEval(clone, depth - 1, alpha, beta);
            minEval = Math.min(minEval, ev); beta = Math.min(beta, ev); if (beta <= alpha) break;
        }
        return minEval;
    }
}

function makeComputerMove() {
    if (isGameOver) return;
    const moves = getLegalMoves(gameState);
    if (moves.length === 0) return;
    
    moves.sort((a,b) => (gameState.board[b.r2][b.c2]!=='' ? 1:0) - (gameState.board[a.r2][a.c2]!=='' ? 1:0));

    let bestMove = null; 
    let bestValue = gameState.turn === 'w' ? -Infinity : Infinity;
    const depth = gameSettings.level;

    setTimeout(() => {
        try {
            for (let m of moves) {
                let clone = lightClone(gameState); 
                if (m.promo) m.promo = gameState.turn === 'w' ? 'Q' : 'q';
                applyMove(clone, m);
                let val = getBestEval(clone, depth - 1, -Infinity, Infinity);
                
                if (gameSettings.level === 1) val += (Math.random() * 40 - 20); 
                
                if (gameState.turn === 'w') { 
                    if (val > bestValue) { bestValue = val; bestMove = m; } 
                } else { 
                    if (val < bestValue) { bestValue = val; bestMove = m; } 
                }
            }
            if (bestMove) { 
                if (bestMove.promo) bestMove.promo = gameState.turn === 'w' ? 'Q' : 'q';
                isComputerThinking = false; 
                processMoveSequence(bestMove, false); 
            }
        } catch (e) {
            console.error("Engine error:", e);
            isComputerThinking = false;
        }
    }, 50);
}

function calculateMoveQuality(evalBefore, evalAfter, playerColor) {
    // חישוב ההפסד בניקוד בעקבות המהלך
    let loss = (playerColor === 'w') ? (evalBefore - evalAfter) : (evalAfter - evalBefore);
    
    if (loss <= 30) return { key: 'best', class: 'badge-best', text: '⭐ מצוין (Best)' };
    if (loss <= 80) return { key: 'excellent', class: 'badge-excellent', text: '✔️ טוב מאוד' };
    if (loss <= 150) return { key: 'good', class: 'badge-good', text: '👍 סולידי' };
    if (loss <= 300) return { key: 'inaccuracy', class: 'badge-inaccuracy', text: '🤔 אי-דיוק' };
    if (loss <= 500) return { key: 'mistake', class: 'badge-mistake', text: '❌ שגיאה' };
    return { key: 'blunder', class: 'badge-blunder', text: '❓❗ טעות קריטית' };
}

function updateUI(isPlayerMove, moveQualityObj = null) {
    if (currentMode === 'puzzles') return;
    updateCapturedMaterial();
    renderMoveList();
    renderClocks();
    
    if (isAnalysisMode) {
        let score = evaluatePosition(gameState);
        let pct = 50 + (score / 1000) * 50;
        document.getElementById('eval-bar-fill').style.height = `${Math.max(5, Math.min(95, pct))}%`;
        
        if (isPlayerMove && moveQualityObj) {
            const b = document.getElementById('move-quality-badge');
            if (b) {
                b.className = `analysis-badge ${moveQualityObj.class}`;
                b.textContent = moveQualityObj.text;
                b.style.opacity = '1';
            }
            const t = document.getElementById('analysis-text');
            if (t) {
                t.textContent = `המהלך האחרון שלך הוערך כ-${moveQualityObj.text.replace(/[^א-ת ]/g, '').trim()}`;
            }
        }
    }
}

function handleGameOver(result) {
    isGameOver = true;
    clearInterval(timerInterval);
    isClockRunning = false;
    
    let text = result === 'draw' ? 'המשחק נגמר בתיקו (פט)' : 
               result === 'white_time' ? 'הלבן ניצח (הזמן של השחור תם)' :
               result === 'black_time' ? 'השחור ניצח (הזמן של הלבן תם)' :
               (result === 'white' ? 'הלבן ניצח במט!' : 'השחור ניצח במט!');
               
    document.getElementById('game-over-text').textContent = text;
    document.getElementById('stat-best').textContent = gameStats.best;
    document.getElementById('stat-excellent').textContent = gameStats.excellent;
    document.getElementById('stat-good').textContent = gameStats.good;
    document.getElementById('stat-inaccuracy').textContent = gameStats.inaccuracy;
    document.getElementById('stat-mistake').textContent = gameStats.mistake;
    document.getElementById('stat-blunder').textContent = gameStats.blunder;
    
    document.getElementById('game-review-stats').style.display = 'block';
    document.getElementById('game-over-modal').style.display = 'flex';
}

function selectPromotion(piece) { 
    if (promotionCallback) promotionCallback(piece); 
    promotionCallback = null; 
}

function closeGameOverModal() { 
    document.getElementById('game-over-modal').style.display = 'none'; 
}

document.addEventListener('DOMContentLoaded', initGame);