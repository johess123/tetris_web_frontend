import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

const BLOCK_SIZE = 30;
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;

const BLOCKS_ROTATIONS = [
    { // I
        rotations: [[[0, 0], [-1, 0], [-2, 0], [1, 0]], [[0, 0], [0, -1], [0, -2], [0, 1]]],
        num: 2
    },
    { // O
        rotations: [[[-1, 0], [-1, 1], [0, 1], [0, 0]]],
        num: 1
    },
    { // Z
        rotations: [[[0, 0], [-1, 0], [0, 1], [1, 1]], [[1, 0], [1, -1], [0, 0], [0, 1]]],
        num: 2
    },
    { // S
        rotations: [[[0, 0], [1, 0], [0, 1], [-1, 1]], [[-1, -1], [-1, 0], [0, 0], [0, 1]]],
        num: 2
    },
    { // L
        rotations: [[[0, 0], [-1, 0], [1, 0], [-1, 1]], [[0, 0], [0, 1], [0, -1], [1, 1]], [[0, 0], [1, 0], [-1, 0], [1, -1]], [[0, 0], [0, -1], [0, 1], [-1, -1]]],
        num: 4
    },
    { // J
        rotations: [[[0, 0], [-1, 0], [1, 0], [1, 1]], [[0, 0], [0, 1], [0, -1], [1, -1]], [[0, 0], [1, 0], [-1, 0], [-1, -1]], [[0, 0], [0, -1], [0, 1], [-1, 1]]],
        num: 4
    },
    { // T
        rotations: [[[0, 0], [-1, 0], [1, 0], [0, 1]], [[0, 0], [0, 1], [0, -1], [1, 0]], [[0, 0], [1, 0], [-1, 0], [0, -1]], [[0, 0], [0, -1], [0, 1], [-1, 0]]],
        num: 4
    }
];

const COLOR_PALETTES = [
    ['rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)'], // I
    ['rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)'], // O
    ['rgb(0,255,255)', 'rgb(153,255,77)', 'rgb(255,179,230)', 'rgb(153,255,77)', 'rgb(153,255,77)', 'rgb(135,206,250)', 'rgb(119,136,153)', 'rgb(176,23,31)', 'rgb(255,0,0)', 'rgb(255,255,0)'], // Z
    ['rgb(13,51,255)', 'rgb(0,128,0)', 'rgb(186,85,211)', 'rgb(13,51,255)', 'rgb(255,20,147)', 'rgb(0,255,128)', 'rgb(255,0,0)', 'rgb(186,85,211)', 'rgb(13,51,255)', 'rgb(138,43,226)'], // S
    ['rgb(0,255,255)', 'rgb(153,255,77)', 'rgb(255,179,230)', 'rgb(153,255,77)', 'rgb(153,255,77)', 'rgb(135,206,250)', 'rgb(119,136,153)', 'rgb(176,23,31)', 'rgb(255,0,0)', 'rgb(255,255,0)'], // L
    ['rgb(13,51,255)', 'rgb(0,128,0)', 'rgb(186,85,211)', 'rgb(13,51,255)', 'rgb(255,20,147)', 'rgb(0,255,128)', 'rgb(255,0,0)', 'rgb(186,85,211)', 'rgb(13,51,255)', 'rgb(138,43,226)'], // J
    ['rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)']  // T
];

const ALL_SPEEDS = [48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1];
const ADVANCE_LINES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 100, 100, 100, 100, 100, 100, 110, 120, 130, 130, 130, 130, 130, 130, 130, 130, 130, 130, 130, 130];
const BG_IMAGES_COUNT = 20;

const SOUNDS = {
    bgm: '/audio/bgm.mp3',
    move: '/audio/move.mp3',
    land: '/audio/land.mp3',
    single: '/audio/single.mp3',
    double: '/audio/double.mp3',
    triple: '/audio/triple.mp3',
    tetris: ['/audio/tetris1.mp3', '/audio/tetris2.mp3', '/audio/tetris3.mp3', '/audio/tetris4.mp3'],
    levelup: '/audio/levelup.mp3',
    lose: '/audio/lose.mp3',
    topout: '/audio/topout.mp3',
    ed: '/audio/ed.mp3',
    count: '/audio/count.mp3'
};

const GameBoard = ({ user, roomData, onBack }) => {
    const socket = useSocket();
    const gameScreenRef = useRef(null);
    const canvasRef = useRef(null);
    const nextCanvasRef = useRef(null);
    const oppCanvasRef = useRef(null);
    const oppNextCanvasRef = useRef(null);

    // Game States
    const [gameState, setGameState] = useState('LOBBY'); // LOBBY, COUNTING, PLAYING, GAMEOVER
    const [preGameCount, setPreGameCount] = useState(3);
    const [gameOverCountdown, setGameOverCountdown] = useState(10);
    const [winner, setWinner] = useState(null);

    // Multiplayer States
    const [playerIndex, setPlayerIndex] = useState(-1);
    const [roomStats, setRoomStats] = useState({
        player_name: ['', ''],
        best_score: ['', ''],
        player_win: ['', ''],
        player_lose: ['', ''],
        player_tie: ['', ''],
        ready_level: [-1, -1]
    });
    const [opponentData, setOpponentData] = useState({
        grid: Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0)),
        score: 0,
        lines: 0,
        level: 0,
        hz: '0.00',
        nextBlockType: undefined,
        drt: 0, trt: 0, brn: 0,
        pos: { x: 5, y: 0 },
        rotationIndex: 0,
        blockType: undefined,
        isGameOver: false
    });

    const [selectedLevel, setSelectedLevel] = useState(roomData.level || 0);
    const [myGameOver, setMyGameOver] = useState(false);

    const gameRef = useRef({
        pos: { x: 5, y: 0 },
        blockType: undefined,
        rotationIndex: 0,
        nextBlockType: undefined,
        seeds: [],
        seedIndex: 0,
        lastTime: 0,
        dropCounter: 0,
        dropInterval: 1000,
        grid: Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0)),
        score: 0,
        lines: 0,
        tetrisLines: 0,
        level: roomData.level || 0,
        startLevel: roomData.level || 0,
        bgCount: 0,
        advanceLine: 10,
        oldLines: 0,
        advanceFirst: false,
        clearingLines: [],
        clearingPhase: -1,
        clearingTimer: 0,
        startWait: 0,
        startPreDropWait: 90,
        drt: 0,
        brn: 0,
        tetrisNum: 0,
        tetris19Num: 0,
        gameOverSoundTriggered: false,
        flashActive: false,
        flashFrameCounter: 0,
        flashWhiteIdx: 0,
        flashLevel: 0,
        keysDown: {},
        dasCounter: 0,
        lastMoveDir: 0,
        isDashing: false,
        hz: '0.00',
        clickIntervals: []
    });

    const audioRefs = useRef({});
    const bgImages = useRef([]);
    const whiteImages = useRef([]);
    const grayFlashImages = useRef([]);
    const grayBg = useRef(null);
    const loseImg = useRef(null);
    const winImg = useRef(null);

    const [uiStats, setUiStats] = useState({
        score: 0,
        lines: 0,
        level: roomData.level || 0,
        drt: 0,
        trt: 0,
        brn: 0,
        hz: '0.00'
    });

    const playSound = (name, index = null) => {
        let audio = audioRefs.current[name];
        if (index !== null && Array.isArray(audio)) audio = audio[index];
        if (audio) { audio.currentTime = 0; audio.play().catch(e => console.error("Audio play failed:", e)); }
    };

    const collide = useCallback((coords, pos, grid) => {
        for (let coord of coords) {
            const px = coord[0] + pos.x, py = coord[1] + pos.y;
            if (px < 0 || px >= GRID_WIDTH || py >= GRID_HEIGHT || py < 0 || (py >= 0 && grid[py][px] !== 0)) return true;
        }
        return false;
    }, []);

    const drawCell = useCallback((ctx, x, y, typeIdx, level, size = BLOCK_SIZE, isGhost = false) => {
        if (typeIdx === 0) return;
        const colorIdx = typeIdx - 1;
        level = level % 10;
        const baseColor = COLOR_PALETTES[colorIdx][level];
        const secondaryColor = COLOR_PALETTES[3][level];
        const px = x * size, py = y * size;
        const pSize = size / 9;

        if (isGhost) {
            ctx.strokeStyle = 'rgb(120,120,120)'; ctx.lineWidth = 4;
            ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);
            ctx.fillStyle = 'black'; ctx.fillRect(px + 4, py + 4, size - 8, size - 8);
            return;
        }

        ctx.fillStyle = (colorIdx === 0 || colorIdx === 1 || colorIdx === 6) ? secondaryColor : baseColor;
        ctx.fillRect(px, py, size, size);

        if (colorIdx === 0 || colorIdx === 1 || colorIdx === 6) {
            ctx.fillStyle = 'white';
            ctx.fillRect(px + pSize, py + pSize, size - pSize * 3, size - pSize * 3);
            ctx.fillRect(px, py, pSize, pSize);
        } else if (!(level === 9 && (colorIdx === 2 || colorIdx === 4))) {
            ctx.fillStyle = 'white';
            ctx.fillRect(px, py, pSize, pSize);
            ctx.fillRect(px + pSize, py + pSize, pSize, pSize);
            ctx.fillRect(px + pSize * 2, py + pSize, pSize, pSize);
            ctx.fillRect(px + pSize, py + pSize * 2, pSize, pSize);
        }

        ctx.fillStyle = 'black';
        ctx.fillRect(px + size - pSize, py, pSize, size);
        ctx.fillRect(px, py + size - pSize, size, pSize);
    }, []);

    const drawGrid = (ctx, grid, level, clearingLines = [], clearingPhase = -1, flashActive = false, flashFrameCounter = 0) => {
        grid.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    if (clearingPhase >= 0 && clearingLines.includes(y)) { if (Math.abs(x - 4.5) <= clearingPhase + 0.5) return; }
                    if (flashActive && clearingLines.includes(y)) { if (Math.abs(x - 4.5) <= Math.floor((30 - flashFrameCounter) / 6) + 0.5) return; }
                    drawCell(ctx, x, y, value, level);
                }
            });
        });
    };

    const drawDeadOverlay = (ctx, canvas) => {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (loseImg.current && loseImg.current.complete) {
            // Center the "Haha you died" image
            ctx.drawImage(loseImg.current, (canvas.width - 280) / 2, (canvas.height - 100) / 2, 280, 100);
        } else {
            ctx.fillStyle = '#ff3333';
            ctx.font = '24px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        }
    };

    const draw = useCallback(() => {
        const g = gameRef.current;
        const config = JSON.parse(localStorage.getItem('tetris_settings') || '{}');

        // Main Board
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            const bgIdx = Math.floor(g.bgCount / 4) % BG_IMAGES_COUNT;
            if (bgImages.current[bgIdx] && gameScreenRef.current) gameScreenRef.current.style.backgroundImage = `url(${bgImages.current[bgIdx].src})`;

            if (g.level % 10 === 9 && grayBg.current && grayBg.current.complete) ctx.drawImage(grayBg.current, 0, 0, ctx.canvas.width, ctx.canvas.height);
            else { ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); }

            if (g.flashActive) {
                const pass_frame = Math.floor(g.flashFrameCounter), cycle = (30 - pass_frame), clean_i = Math.floor(cycle / 3);
                if (clean_i % 2 === 0) {
                    let img = (g.flashLevel % 10 === 9 && g.tetris19Num < 2) ? grayFlashImages.current[g.tetris19Num % 2] : whiteImages.current[g.flashWhiteIdx % 12];
                    if (img && img.complete) ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
                } else {
                    if (g.flashLevel % 10 === 9) { if (grayBg.current) ctx.drawImage(grayBg.current, 0, 0, ctx.canvas.width, ctx.canvas.height); }
                    else { ctx.fillStyle = 'black'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); }
                }
            }

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 1;
            for (let i = 0; i <= GRID_WIDTH; i++) { ctx.beginPath(); ctx.moveTo(i * BLOCK_SIZE, 0); ctx.lineTo(i * BLOCK_SIZE, GRID_HEIGHT * BLOCK_SIZE); ctx.stroke(); }
            for (let i = 0; i <= GRID_HEIGHT; i++) { ctx.beginPath(); ctx.moveTo(0, i * BLOCK_SIZE); ctx.lineTo(GRID_WIDTH * BLOCK_SIZE, i * BLOCK_SIZE); ctx.stroke(); }

            drawGrid(ctx, g.grid, g.level, g.clearingLines, g.clearingPhase, g.flashActive, g.flashFrameCounter);

            if (!g.flashActive && g.clearingPhase === -1 && g.blockType !== undefined && g.startWait <= 0 && !myGameOver) {
                const coords = BLOCKS_ROTATIONS[g.blockType].rotations[g.rotationIndex];
                if (config.show_preview !== '0') {
                    let ghostY = g.pos.y; while (!collide(coords, { x: g.pos.x, y: ghostY + 1 }, g.grid)) ghostY++;
                    coords.forEach(c => drawCell(ctx, c[0] + g.pos.x, c[1] + ghostY, g.blockType + 1, g.level, BLOCK_SIZE, true));
                }
                coords.forEach(c => drawCell(ctx, c[0] + g.pos.x, c[1] + g.pos.y, g.blockType + 1, g.level));
            }

            if (myGameOver) drawDeadOverlay(ctx, canvasRef.current);
        }

        // Opponent Board
        if (oppCanvasRef.current && roomData.roomNum !== -1) {
            const oCtx = oppCanvasRef.current.getContext('2d');
            oCtx.fillStyle = '#000'; oCtx.fillRect(0, 0, oCtx.canvas.width, oCtx.canvas.height);

            // Grid lines for opponent
            oCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; oCtx.lineWidth = 1;
            for (let i = 0; i <= GRID_WIDTH; i++) { oCtx.beginPath(); oCtx.moveTo(i * BLOCK_SIZE, 0); oCtx.lineTo(i * BLOCK_SIZE, GRID_HEIGHT * BLOCK_SIZE); oCtx.stroke(); }
            for (let i = 0; i <= GRID_HEIGHT; i++) { oCtx.beginPath(); oCtx.moveTo(0, i * BLOCK_SIZE); oCtx.lineTo(GRID_WIDTH * BLOCK_SIZE, i * BLOCK_SIZE); oCtx.stroke(); }

            drawGrid(oCtx, opponentData.grid, opponentData.level);

            if (!opponentData.isGameOver && opponentData.blockType !== undefined) {
                const oCoords = BLOCKS_ROTATIONS[opponentData.blockType].rotations[opponentData.rotationIndex];
                oCoords.forEach(c => drawCell(oCtx, c[0] + opponentData.pos.x, c[1] + opponentData.pos.y, opponentData.blockType + 1, opponentData.level));
            }

            if (opponentData.isGameOver) drawDeadOverlay(oCtx, oppCanvasRef.current);
        }

    }, [drawCell, collide, opponentData, myGameOver, roomData.roomNum]);

    const drawNext = useCallback((ctxRef, typeIdx, level, size = 25) => {
        if (!ctxRef.current) return;
        const ctx = ctxRef.current.getContext('2d');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        if (typeIdx !== undefined) {
            const rotations = BLOCKS_ROTATIONS[typeIdx].rotations[0];
            // Center any piece
            let minX = 10, maxX = -10, minY = 10, maxY = -10;
            rotations.forEach(c => {
                minX = Math.min(minX, c[0]); maxX = Math.max(maxX, c[0]);
                minY = Math.min(minY, c[1]); maxY = Math.max(maxY, c[1]);
            });
            const blockWidth = maxX - minX + 1;
            const blockHeight = maxY - minY + 1;
            const offsetX = (ctx.canvas.width / size - blockWidth) / 2 - minX;
            const offsetY = (ctx.canvas.height / size - blockHeight) / 2 - minY;
            rotations.forEach(c => drawCell(ctx, c[0] + offsetX, c[1] + offsetY, typeIdx + 1, level, size));
        }
    }, [drawCell]);

    const spawnBlock = useCallback(() => {
        const g = gameRef.current; if (g.seeds.length === 0 || g.gameOverSoundTriggered) return;
        if (g.blockType === undefined) { g.blockType = g.seeds[g.seedIndex++ % g.seeds.length] % 7; g.nextBlockType = g.seeds[g.seedIndex++ % g.seeds.length] % 7; }
        else { g.blockType = g.nextBlockType; g.nextBlockType = g.seeds[g.seedIndex++ % g.seeds.length] % 7; }
        g.pos = { x: 5, y: 0 }; g.rotationIndex = 0; if (g.blockType === 0) g.drt = 0; else g.drt++;

        if (collide(BLOCKS_ROTATIONS[g.blockType].rotations[g.rotationIndex], g.pos, g.grid)) {
            if (audioRefs.current.bgm) audioRefs.current.bgm.pause();
            if (!g.gameOverSoundTriggered) {
                g.gameOverSoundTriggered = true;
                setMyGameOver(true);
                playSound('topout'); playSound('lose'); playSound('ed');
                if (roomData.roomNum !== -1 && socket) {
                    socket.emit('gameover', { room_num: roomData.roomNum, uid: user.account });
                    if (opponentData.isGameOver) {
                        // If the opponent is already dead, and I just died, I stayed alive longer.
                        setWinner('WIN');
                        setGameState('GAMEOVER');
                    }
                } else if (roomData.roomNum === -1) {
                    setGameState('GAMEOVER');
                }
            }
            return;
        }
        drawNext(nextCanvasRef, g.nextBlockType, g.level, 25);
        setUiStats(prev => ({ ...prev, drt: g.drt, trt: Math.round((g.tetrisLines / (g.lines || 1)) * 100) }));
    }, [drawNext, collide, roomData.roomNum, socket, user.account, opponentData.isGameOver]);

    const merge = useCallback(() => {
        const g = gameRef.current; if (g.clearingPhase >= 0 || g.flashActive || g.gameOverSoundTriggered) return;
        const newGrid = g.grid.map(row => [...row]);
        BLOCKS_ROTATIONS[g.blockType].rotations[g.rotationIndex].forEach(c => {
            const py = c[1] + g.pos.y, px = c[0] + g.pos.x;
            if (py >= 0 && py < GRID_HEIGHT && px >= 0 && px < GRID_WIDTH) newGrid[py][px] = g.blockType + 1;
        });
        let cleared = 0, cleanLines = [];
        for (let y = GRID_HEIGHT - 1; y >= 0; y--) { if (newGrid[y].every(cell => cell !== 0)) { cleanLines.push(y); cleared++; } }
        if (cleared > 0) {
            g.clearingLines = cleanLines;
            if (cleared === 4) {
                g.flashActive = true; g.flashFrameCounter = 30; g.flashLevel = g.level;
                if (g.level % 10 === 9 && g.tetris19Num < 2) playSound('tetris', g.tetris19Num + 2); else playSound('tetris', g.tetrisNum);
                g.brn = 0; g.tetrisLines += 4;
            } else {
                g.clearingPhase = 0; g.clearingTimer = 0;
                if (cleared === 1) playSound('single'); else if (cleared === 2) playSound('double'); else if (cleared === 3) playSound('triple');
                g.brn++;
            }
            g.score += [0, 40, 100, 300, 1200][cleared] * (g.level + 1); g.lines += cleared;
            const prevLvl = g.level;
            const threshold = g.advanceFirst ? 10 : (ADVANCE_LINES[g.startLevel] || 10);
            if (g.lines >= (g.advanceFirst ? g.oldLines : 0) + threshold) {
                if (!g.advanceFirst) { g.oldLines = threshold; g.advanceFirst = true; }
                else { g.oldLines += 10; }
                g.level++;
            }
            if (g.level > prevLvl) playSound('levelup');
            g.startWait = 18;
            setUiStats(prev => ({ ...prev, score: g.score, lines: g.lines, level: g.level, brn: g.brn, trt: Math.round((g.tetrisLines / (g.lines || 1)) * 100) }));
        } else { playSound('land'); g.startWait = 18; g.dropCounter = 0; spawnBlock(); }
        g.grid = newGrid;
    }, [playSound, collide, spawnBlock]);

    useEffect(() => {
        Object.entries(SOUNDS).forEach(([key, value]) => {
            if (Array.isArray(value)) audioRefs.current[key] = value.map(src => new Audio(src));
            else { audioRefs.current[key] = new Audio(value); if (key === 'bgm') { audioRefs.current[key].loop = true; audioRefs.current[key].volume = 0.5; } }
        });
        for (let i = 1; i <= BG_IMAGES_COUNT; i++) { const img = new Image(); img.src = `/img_multi/bg${i}.jpg`; bgImages.current.push(img); }
        for (let i = 1; i <= 12; i++) { const img = new Image(); const ext = [12, 3, 4, 6, 8].includes(i) ? 'png' : 'jpg'; img.src = `/img_multi/white${i}.${ext}`; whiteImages.current.push(img); }
        const g1 = new Image(); g1.src = '/img_multi/gray1.png'; const g2 = new Image(); g2.src = '/img_multi/gray2.jpg';
        grayFlashImages.current = [g1, g2]; grayBg.current = new Image(); grayBg.current.src = '/img_multi/gray.jpg';
        loseImg.current = new Image(); loseImg.current.src = '/img_multi/lose.png'; winImg.current = new Image(); winImg.current.src = '/img_multi/win.png';

        if (roomData.roomNum !== -1 && socket) {
            socket.on('room_locked_error', (data) => { alert(data.msg); onBack(); });
            socket.on('in_room', (data) => {
                setRoomStats(data);
                const myIdx = data.player_name.indexOf(user.account);
                if (myIdx !== -1) setPlayerIndex(myIdx);
            });
            socket.on('play_ready', (data) => { setRoomStats(prev => ({ ...prev, ready_level: data.ready_level })); });
            socket.on('get_random_block', (data) => { gameRef.current.seeds = data.random_block; setGameState('COUNTING'); playSound('count'); });
            socket.on('tetris_client_block', (data) => {
                if (data.uid !== user.account) {
                    setOpponentData(prev => ({ ...prev, ...data }));
                    drawNext(oppNextCanvasRef, data.nextBlockType, data.level, 25);
                }
            });
            socket.on('client_gameover', (data) => {
                if (data.uid !== user.account) {
                    setOpponentData(prev => ({ ...prev, isGameOver: true }));
                    if (gameRef.current.gameOverSoundTriggered) {
                        // Both are finished. Since I was already dead, I died first.
                        setWinner('LOSE');
                        setGameState('GAMEOVER');
                    }
                }
            });
            socket.connect();
            socket.emit('register_player', { uid: user.account, room_num: roomData.roomNum, best_score: roomData.stats.best, player_win: roomData.stats.win, player_lose: roomData.stats.lose, player_tie: roomData.stats.tie });
        } else if (roomData.roomNum === -1) {
            setGameState('COUNTING'); playSound('count');
            gameRef.current.seeds = Array.from({ length: 1000 }, () => Math.floor(Math.random() * 1000));
        }

        return () => {
            if (socket) { if (roomData.roomNum !== -1) socket.emit('leave_room', { uid: user.account, room_num: roomData.roomNum }); socket.disconnect(); socket.off('in_room'); socket.off('play_ready'); socket.off('get_random_block'); socket.off('tetris_client_block'); socket.off('client_gameover'); socket.off('room_locked_error'); }
            Object.values(audioRefs.current).forEach(audio => { if (Array.isArray(audio)) audio.forEach(a => { a.pause(); a.currentTime = 0; }); else { audio.pause(); audio.currentTime = 0; } });
        };
    }, []);

    useEffect(() => {
        if (playerIndex === 0 && roomStats.ready_level[0] !== -1 && roomStats.ready_level[1] !== -1 && gameState === 'LOBBY') {
            const seeds = Array.from({ length: 1000 }, () => Math.floor(Math.random() * 1000));
            socket.emit('send_random_block', { room_num: roomData.roomNum, random_block: seeds });
        }
    }, [playerIndex, roomStats.ready_level, gameState]);

    const handleSoftDrop = useCallback(() => {
        const g = gameRef.current;
        if (g.blockType === undefined) return;
        const coords = BLOCKS_ROTATIONS[g.blockType].rotations[g.rotationIndex];
        g.pos.y++; g.dropCounter = 0;
        if (collide(coords, g.pos, g.grid)) { g.pos.y--; merge(); }
    }, [collide, merge]);

    const handleHardDrop = useCallback(() => {
        const g = gameRef.current;
        if (g.blockType === undefined) return;
        const coords = BLOCKS_ROTATIONS[g.blockType].rotations[g.rotationIndex];
        while (!collide(coords, { x: g.pos.x, y: g.pos.y + 1 }, g.grid)) g.pos.y++;
        merge();
    }, [collide, merge]);

    const handleRotateLeft = useCallback(() => {
        const g = gameRef.current;
        if (g.blockType === undefined) return;
        const nextRot = (g.rotationIndex + 1) % BLOCKS_ROTATIONS[g.blockType].num;
        if (!collide(BLOCKS_ROTATIONS[g.blockType].rotations[nextRot], g.pos, g.grid)) { g.rotationIndex = nextRot; playSound('move'); }
    }, [collide, playSound]);

    const handleRotateRight = useCallback(() => {
        const g = gameRef.current;
        if (g.blockType === undefined) return;
        const nextRot = (g.rotationIndex - 1 + BLOCKS_ROTATIONS[g.blockType].num) % BLOCKS_ROTATIONS[g.blockType].num;
        if (!collide(BLOCKS_ROTATIONS[g.blockType].rotations[nextRot], g.pos, g.grid)) { g.rotationIndex = nextRot; playSound('move'); }
    }, [collide, playSound]);

    useEffect(() => {
        const tickRate = 1000 / 60; let lastTimestamp = performance.now(); let accumulator = 0; let animationFrameId;

        const pollGamepad = () => {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            const config = JSON.parse(localStorage.getItem('tetris_settings') || '{}');
            const g = gameRef.current;

            for (const gp of gamepads) {
                if (!gp) continue;
                Object.entries(config).forEach(([action, binding]) => {
                    if (typeof binding !== 'string' || !binding.startsWith('gp:')) return;

                    let isDown = false;
                    if (binding.startsWith('gp:button:')) {
                        const btnIdx = parseInt(binding.split(':')[2]);
                        isDown = gp.buttons[btnIdx]?.pressed;
                    } else if (binding.startsWith('gp:axis:')) {
                        const parts = binding.split(':');
                        const axisIdx = parseInt(parts[2]);
                        const sign = parts[3];
                        const val = gp.axes[axisIdx];
                        isDown = (sign === '+' ? val > 0.5 : val < -0.5);
                    }

                    if (isDown && !g.keysDown[binding]) {
                        // Trigger one-shot action for gamepad
                        if (action === 'Drop') handleHardDrop();
                        else if (action === 'Rotate-Left') handleRotateLeft();
                        else if (action === 'Rotate-Right') handleRotateRight();
                        else if (action === 'Down') handleSoftDrop();
                    }
                    g.keysDown[binding] = isDown;
                });
            }
        };

        const animate = (time) => {
            const g = gameRef.current; const deltaTime = time - lastTimestamp; lastTimestamp = time;
            if (gameState === 'PLAYING') {
                accumulator += deltaTime;
                while (accumulator >= tickRate) {
                    pollGamepad();
                    g.bgCount++; if (g.bgCount >= 80) g.bgCount = 0;
                    if (g.bgCount % 5 === 0) { // Sync more frequently for movement
                        const now = performance.now(); g.clickIntervals = g.clickIntervals.filter(t => now - t < 1000);
                        let finalHz = 0; if (g.clickIntervals.length > 1) { const duration = g.clickIntervals[g.clickIntervals.length - 1] - g.clickIntervals[0]; if (duration > 0) finalHz = ((g.clickIntervals.length - 1) / duration) * 1000; }
                        g.hz = finalHz.toFixed(2); setUiStats(prev => ({ ...prev, hz: g.hz }));
                        if (roomData.roomNum !== -1 && socket && socket.connected && !myGameOver) {
                            socket.emit('tetris_server_block', { room_num: roomData.roomNum, uid: user.account, grid: g.grid, score: g.score, lines: g.lines, level: g.level, hz: g.hz, nextBlockType: g.nextBlockType, drt: g.drt, trt: Math.round((g.tetrisLines / (g.lines || 1)) * 100), brn: g.brn, pos: g.pos, rotationIndex: g.rotationIndex, blockType: g.blockType });
                        }
                    }
                    if (!myGameOver) {
                        if (g.flashActive) {
                            g.flashFrameCounter--;
                            if (g.flashFrameCounter <= 0) {
                                g.flashActive = false; if (g.level % 10 === 9 && g.tetris19Num < 2) g.tetris19Num++; else { g.flashWhiteIdx++; if (g.flashWhiteIdx >= 12) g.flashWhiteIdx = 0; g.tetrisNum = 1 - g.tetrisNum; }
                                const newGrid = g.grid.filter((_, y) => !g.clearingLines.includes(y)); while (newGrid.length < GRID_HEIGHT) newGrid.unshift(Array(GRID_WIDTH).fill(0)); g.grid = newGrid; g.clearingLines = [];
                                spawnBlock();
                            }
                        } else if (g.clearingPhase >= 0) {
                            g.clearingTimer += tickRate; if (g.clearingTimer > 60) { g.clearingPhase++; g.clearingTimer = 0; if (g.clearingPhase > 4) { const newGrid = g.grid.filter((_, y) => !g.clearingLines.includes(y)); while (newGrid.length < GRID_HEIGHT) newGrid.unshift(Array(GRID_WIDTH).fill(0)); g.grid = newGrid; g.clearingPhase = -1; g.clearingLines = []; spawnBlock(); } }
                        } else {
                            if (g.blockType !== undefined) {
                                const config = JSON.parse(localStorage.getItem('tetris_settings') || '{}'); const leftKey = (config.Left || 'arrowleft').toLowerCase(), rightKey = (config.Right || 'arrowright').toLowerCase();
                                let moveDir = 0; if (g.keysDown[leftKey]) moveDir = -1; else if (g.keysDown[rightKey]) moveDir = 1;
                                if (moveDir !== 0) {
                                    if (g.lastMoveDir !== moveDir) {
                                        g.pos.x += moveDir;
                                        if (collide(BLOCKS_ROTATIONS[g.blockType].rotations[g.rotationIndex], g.pos, g.grid)) g.pos.x -= moveDir;
                                        else { playSound('move'); g.clickIntervals.push(performance.now()); }
                                        g.dasCounter = 1; g.lastMoveDir = moveDir; g.isDashing = false;
                                    }
                                    else { g.dasCounter++; let threshold = g.isDashing ? 6 : 16; if (g.dasCounter >= threshold) { g.pos.x += moveDir; if (collide(BLOCKS_ROTATIONS[g.blockType].rotations[g.rotationIndex], g.pos, g.grid)) g.pos.x -= moveDir; else playSound('move'); g.dasCounter = 1; g.isDashing = true; } }
                                } else { g.lastMoveDir = 0; g.dasCounter = 0; g.isDashing = false; }
                            }
                            if (g.startPreDropWait > 0) { g.startPreDropWait--; if (g.blockType === undefined) spawnBlock(); }
                            else if (g.startWait > 0) { g.startWait--; }
                            else if (g.blockType !== undefined) { g.dropCounter += tickRate; if (g.dropCounter >= (ALL_SPEEDS[g.level] || 1) * (1000 / 60)) { g.pos.y++; if (collide(BLOCKS_ROTATIONS[g.blockType].rotations[g.rotationIndex], g.pos, g.grid)) { g.pos.y--; merge(); } g.dropCounter = 0; } }
                        }
                    }
                    accumulator -= tickRate;
                }
            }
            draw(); animationFrameId = requestAnimationFrame(animate);
        };
        animationFrameId = requestAnimationFrame(animate); return () => cancelAnimationFrame(animationFrameId);
    }, [gameState, socket, user.account, roomData.roomNum, myGameOver]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const g = gameRef.current; const k = (e.key === ' ' ? 'space' : e.key).toLowerCase(); g.keysDown[k] = true;
            if (gameState !== 'PLAYING' || myGameOver || g.clearingPhase >= 0 || g.flashActive || g.blockType === undefined) return;
            const config = JSON.parse(localStorage.getItem('tetris_settings') || '{}');
            const leftKey = (config.Left || 'arrowleft').toLowerCase(), rightKey = (config.Right || 'arrowright').toLowerCase();
            if (!e.repeat && (k === leftKey || k === rightKey)) g.clickIntervals.push(performance.now());
            const keys = { down: (config.Down || 'arrowdown').toLowerCase(), drop: (config.Drop || 'space').toLowerCase(), rotateR: (config['Rotate-Right'] || 'z').toLowerCase(), rotateL: (config['Rotate-Left'] || 'x').toLowerCase() };
            if (g.startPreDropWait <= 0 && g.startWait <= 0) {
                if (k === keys.down) handleSoftDrop();
                if (k === keys.drop && !e.repeat) handleHardDrop();
            }
            if (k === keys.rotateL) handleRotateLeft();
            if (k === keys.rotateR) handleRotateRight();
        };
        const handleKeyUp = (e) => { gameRef.current.keysDown[(e.key === ' ' ? 'space' : e.key).toLowerCase()] = false; };
        window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, [gameState, myGameOver]);

    useEffect(() => {
        if (gameState === 'COUNTING' && (roomStats.ready_level[0] === -1 || roomStats.ready_level[1] === -1)) {
            setGameState('LOBBY');
            setPreGameCount(3);
        }
    }, [roomStats.ready_level, gameState]);

    useEffect(() => {
        let timer;
        if (gameState === 'COUNTING') {
            timer = setInterval(() => {
                setPreGameCount(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setGameState('PLAYING');
                        const g = gameRef.current;
                        g.level = selectedLevel;
                        g.startLevel = selectedLevel;
                        g.score = 0; g.lines = 0; g.tetrisLines = 0; g.oldLines = 0; g.advanceFirst = false;
                        g.grid = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0));
                        g.gameOverSoundTriggered = false;
                        setUiStats(s => ({ ...s, level: selectedLevel, score: 0, lines: 0 }));
                        if (audioRefs.current.bgm) {
                            audioRefs.current.bgm.currentTime = 0;
                            audioRefs.current.bgm.play().catch(e => console.error("BGM play failed:", e));
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameState, selectedLevel]);

    useEffect(() => {
        let timer; if (gameState === 'GAMEOVER') { timer = setInterval(() => { setGameOverCountdown(prev => { if (prev <= 1) { clearInterval(timer); onBack(); return 0; } return prev - 1; }); }, 1000); }
        return () => clearInterval(timer);
    }, [gameState]);

    const handleReady = () => { if (socket && roomData.roomNum !== -1 && playerIndex !== -1) socket.emit('room_ready', { uid: user.account, room_num: roomData.roomNum, player_index: playerIndex, level: selectedLevel }); };
    const handleCancelReady = () => { if (socket && roomData.roomNum !== -1 && playerIndex !== -1) socket.emit('room_ready', { uid: user.account, room_num: roomData.roomNum, player_index: playerIndex, level: -1 }); };

    const renderPlayerInfo = (idx) => {
        const name = roomStats.player_name[idx]; if (name === '') return <div style={{ width: '250px' }}></div>;
        const stats = { best: roomStats.best_score[idx] || '0', win: roomStats.player_win[idx] || '0', lose: roomStats.player_lose[idx] || '0', tie: roomStats.player_tie[idx] || '0' };
        return (
            <div style={{ width: '250px', textAlign: idx === 0 ? 'left' : 'right', fontFamily: '"Press Start 2P"' }}>
                <div style={{ color: 'yellow', fontSize: '1.5rem', marginBottom: '15px' }}>Player{idx + 1}</div>
                <div style={{ color: 'white', fontSize: '1.2rem', marginBottom: '30px' }}>{name}</div>
                <div style={{ color: 'cyan', fontSize: '1.2rem', marginBottom: '10px' }}>Best Score</div>
                <div style={{ color: 'white', fontSize: '1.2rem', marginBottom: '30px' }}>{String(stats.best).padStart(6, '0')}</div>
                <div style={{ display: 'flex', justifyContent: idx === 0 ? 'flex-start' : 'flex-end', gap: '15px', marginBottom: '10px' }}>
                    <span style={{ color: 'red', fontSize: '0.9rem' }}>Win</span><span style={{ color: 'cyan', fontSize: '0.9rem' }}>Lose</span><span style={{ color: 'yellow', fontSize: '0.9rem' }}>Tie</span>
                </div>
                <div style={{ display: 'flex', justifyContent: idx === 0 ? 'flex-start' : 'flex-end', gap: '35px', color: 'white', fontSize: '1.1rem', marginBottom: '30px' }}>
                    <span>{stats.win}</span><span>{stats.lose}</span><span>{stats.tie}</span>
                </div>
                <div style={{ color: 'red', fontSize: '1.2rem', marginBottom: '15px' }}>Rank</div>
                <img src={`/img_multi/${idx + 1}.png`} alt="rank" style={{ width: '70px', marginBottom: '30px' }} />
                <div style={{ color: 'cyan', fontSize: '1rem', marginBottom: '15px' }}>Select Level</div>
                <div style={{ color: 'white', fontSize: '1.2rem' }}>{roomStats.ready_level[idx] !== -1 ? roomStats.ready_level[idx] : (idx === playerIndex ? selectedLevel : '0')}</div>
            </div>
        );
    };

    const renderLobby = () => {
        const bothReady = roomStats.ready_level[0] !== -1 && roomStats.ready_level[1] !== -1;
        return (
            <div className="lobby-overlay" style={{ position: 'absolute', inset: 0, background: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', color: 'white', fontFamily: '"Press Start 2P"' }}>
                <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '4rem', color: roomStats.player_name[1] ? '#0ff' : '#f00', margin: '0 0 20px 0' }}>TETRIS</h1>
                    <h2 style={{ fontSize: '2.5rem', color: 'white', margin: 0 }}>LEVEL</h2>
                    <div style={{ position: 'absolute', right: '20px', top: '20px', color: 'red', fontSize: '1.1rem' }}>Room ID : {roomData.roomNum}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '1200px', flexGrow: 1 }}>
                    {renderPlayerInfo(0)}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '600px', marginTop: '40px' }}>
                        {bothReady && <div style={{ color: 'red', fontSize: '0.9rem', marginBottom: '30px', textAlign: 'center', lineHeight: '1.5' }}>Both player selected, game will start in 3 seconds...</div>}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 80px)', gap: '40px 20px', textAlign: 'center', fontSize: '1.8rem' }}>
                            {[...Array(20).keys()].map(lv => <div key={lv} onClick={() => playerIndex !== -1 && playerIndex < 2 && roomStats.ready_level[playerIndex] === -1 && setSelectedLevel(lv)} style={{ cursor: 'pointer', color: selectedLevel === lv ? 'cyan' : 'white' }}>{lv}</div>)}
                        </div>
                        <div style={{ marginTop: 'auto', marginBottom: '40px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 50px' }}>
                            <div onClick={onBack} style={{ cursor: 'pointer', fontSize: '1.5rem', color: 'white', width: '300px', textAlign: 'left' }}>back</div>
                            <div
                                onClick={() => playerIndex !== -1 && playerIndex < 2 && roomStats.ready_level[playerIndex] === -1 && setSelectedLevel(29)}
                                style={{ cursor: 'pointer', fontSize: '1.8rem', color: selectedLevel === 29 ? 'cyan' : 'white', flexGrow: 1, textAlign: 'center' }}
                            >
                                29
                            </div>
                            <div style={{ fontSize: '1rem', color: 'yellow', width: '300px', textAlign: 'right' }}>
                                Play Mode : <span style={{ color: 'white' }}>{playerIndex < 2 ? `Player${playerIndex + 1}` : 'Spectator'}</span>
                            </div>
                        </div>
                        {playerIndex !== -1 && playerIndex < 2 && (
                            <button
                                onClick={roomStats.ready_level[playerIndex] === -1 ? handleReady : handleCancelReady}
                                style={{
                                    background: 'none',
                                    border: '3px solid white',
                                    color: roomStats.ready_level[playerIndex] === -1 ? 'white' : '#ff4444',
                                    padding: '10px 40px',
                                    fontSize: '1.5rem',
                                    fontFamily: '"Press Start 2P"',
                                    cursor: 'pointer',
                                    marginTop: '20px',
                                    minWidth: '280px'
                                }}
                            >
                                {roomStats.ready_level[playerIndex] === -1 ? 'SELECTED' : 'CANCEL'}
                            </button>
                        )}
                    </div>
                    {renderPlayerInfo(1)}
                </div>
            </div>
        );
    };

    const renderPlayerModule = (isMe) => {
        const stats = isMe ? uiStats : opponentData;
        const name = isMe ? user.account : (roomStats.player_name[1 - playerIndex] || 'Waiting...');
        const canvas = isMe ? canvasRef : oppCanvasRef;
        const nextCanvas = isMe ? nextCanvasRef : oppNextCanvasRef;
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                <div className="left-stats" style={{ width: '100px', display: 'flex', flexDirection: 'column', gap: '40px', fontFamily: '"Press Start 2P"', color: 'white' }}>
                    <div className="stat-group"><div style={{ fontSize: '1rem', marginBottom: '10px' }}>DRT</div><div style={{ fontSize: '1.4rem', color: stats.drt > 12 ? 'red' : 'white' }}>{String(stats.drt).padStart(3, '0')}</div></div>
                    <div className="stat-group"><div style={{ fontSize: '1rem', marginBottom: '10px' }}>TRT</div><div style={{ fontSize: '1.4rem' }}>{stats.trt}%</div></div>
                    <div className="stat-group"><div style={{ fontSize: '1rem', marginBottom: '10px' }}>BRN</div><div style={{ fontSize: '1.4rem' }}>{String(stats.brn).padStart(3, '0')}</div></div>
                </div>
                <div className="board-center" style={{ textAlign: 'center' }}>
                    <div style={{ color: 'white', fontFamily: '"Press Start 2P"', fontSize: '1.5rem', marginBottom: '15px' }}>{name}</div>
                    <div className="canvas-container" style={{ border: '4px solid #777', background: '#000' }}><canvas ref={canvas} width={BLOCK_SIZE * GRID_WIDTH} height={BLOCK_SIZE * GRID_HEIGHT} /></div>
                </div>
                <div className="right-stats" style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '30px', fontFamily: '"Press Start 2P"', color: 'white' }}>
                    <div className="stat-group"><div style={{ fontSize: '1rem', marginBottom: '10px' }}>SCORE</div><div style={{ fontSize: '1.4rem' }}>{String(stats.score).padStart(6, '0')}</div></div>
                    <div className="stat-group"><div style={{ fontSize: '1rem', marginBottom: '10px' }}>LINES</div><div style={{ fontSize: '1.4rem' }}>{String(stats.lines).padStart(3, '0')}</div></div>
                    <div className="stat-group">
                        <div style={{ fontSize: '1rem', marginBottom: '10px' }}>NEXT</div>
                        <div style={{ height: '90px', width: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><canvas ref={nextCanvas} width="120" height="90" /></div>
                    </div>
                    <div className="stat-group"><div style={{ fontSize: '1rem', marginBottom: '10px' }}>LEVEL</div><div style={{ fontSize: '1.4rem' }}>{String(stats.level).padStart(2, '0')}</div></div>
                    <div style={{ fontSize: '1rem', color: 'white', marginTop: '10px' }}>{stats.hz} HZ</div>
                </div>
            </div>
        );
    };

    return (
        <div className="game-screen" ref={gameScreenRef}>
            {gameState === 'LOBBY' && roomData.roomNum !== -1 && renderLobby()}
            {gameState === 'COUNTING' && <div style={{ position: 'absolute', inset: 0, background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}><div style={{ fontSize: '100px', color: '#fff', fontFamily: '"Press Start 2P"' }}>{preGameCount > 0 ? preGameCount : ''}</div></div>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '80px', position: 'relative', zIndex: 1, padding: '20px' }}>
                {renderPlayerModule(true)}
                {roomData.roomNum !== -1 && renderPlayerModule(false)}
            </div>
            {gameState === 'GAMEOVER' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 15000 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        {roomData.roomNum !== -1 ? (
                            <>
                                <img src={winner === 'WIN' ? "/img_multi/win.png" : "/img_multi/lose.png"} alt="result" style={{ width: '280px' }} />
                                <div style={{ fontSize: '3rem', color: winner === 'WIN' ? '#0f0' : 'red', textShadow: '4px 4px #000', fontFamily: '"Press Start 2P"' }}>{winner === 'WIN' ? 'YOU WIN!' : winner === 'TIE' ? 'TIE GAME!' : 'YOU LOSE!'}</div>
                            </>
                        ) : (
                            <>
                                <img src="/img_multi/lose.png" alt="lose" style={{ width: '280px' }} />
                                <div style={{ fontSize: '3rem', color: 'yellow', textShadow: '4px 4px #000', fontFamily: '"Press Start 2P"' }}>Game Over!</div>
                            </>
                        )}
                        <div style={{ fontSize: '1.2rem', color: 'red', fontFamily: '"Press Start 2P"' }}>Returning in {gameOverCountdown}s...</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameBoard;
