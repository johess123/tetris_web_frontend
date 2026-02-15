import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

const BLOCK_SIZE = 30;
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;

const BLOCKS_ROTATIONS = [
    { rotations: [[[0, 0], [-1, 0], [-2, 0], [1, 0]], [[0, 0], [0, -1], [0, -2], [0, 1]]], num: 2 },
    { rotations: [[[-1, 0], [-1, 1], [0, 1], [0, 0]]], num: 1 },
    { rotations: [[[0, 0], [-1, 0], [0, 1], [1, 1]], [[1, 0], [1, -1], [0, 0], [0, 1]]], num: 2 },
    { rotations: [[[0, 0], [1, 0], [0, 1], [-1, 1]], [[-1, -1], [-1, 0], [0, 0], [0, 1]]], num: 2 },
    { rotations: [[[0, 0], [-1, 0], [1, 0], [-1, 1]], [[0, 0], [0, 1], [0, -1], [1, 1]], [[0, 0], [1, 0], [-1, 0], [1, -1]], [[0, 0], [0, -1], [0, 1], [-1, -1]]], num: 4 },
    { rotations: [[[0, 0], [-1, 0], [1, 0], [1, 1]], [[0, 0], [0, 1], [0, -1], [1, -1]], [[0, 0], [1, 0], [-1, 0], [-1, -1]], [[0, 0], [0, -1], [0, 1], [-1, 1]]], num: 4 },
    { rotations: [[[0, 0], [-1, 0], [1, 0], [0, 1]], [[0, 0], [0, 1], [0, -1], [1, 0]], [[0, 0], [1, 0], [-1, 0], [0, -1]], [[0, 0], [0, -1], [0, 1], [-1, 0]]], num: 4 }
];

const COLOR_PALETTES = [
    ['rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)'],
    ['rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)'],
    ['rgb(0,255,255)', 'rgb(153,255,77)', 'rgb(255,179,230)', 'rgb(153,255,77)', 'rgb(153,255,77)', 'rgb(135,206,250)', 'rgb(119,136,153)', 'rgb(176,23,31)', 'rgb(255,0,0)', 'rgb(255,255,0)'],
    ['rgb(13,51,255)', 'rgb(0,128,0)', 'rgb(186,85,211)', 'rgb(13,51,255)', 'rgb(255,20,147)', 'rgb(0,255,128)', 'rgb(255,0,0)', 'rgb(186,85,211)', 'rgb(13,51,255)', 'rgb(138,43,226)'],
    ['rgb(0,255,255)', 'rgb(153,255,77)', 'rgb(255,179,230)', 'rgb(153,255,77)', 'rgb(153,255,77)', 'rgb(135,206,250)', 'rgb(119,136,153)', 'rgb(176,23,31)', 'rgb(255,0,0)', 'rgb(255,255,0)'],
    ['rgb(13,51,255)', 'rgb(0,128,0)', 'rgb(186,85,211)', 'rgb(13,51,255)', 'rgb(255,20,147)', 'rgb(0,255,128)', 'rgb(255,0,0)', 'rgb(186,85,211)', 'rgb(13,51,255)', 'rgb(138,43,226)'],
    ['rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)']
];

const ALL_SPEEDS = [48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1];
const ADVANCE_LINES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 100, 100, 100, 100, 100, 100, 110, 120, 130, 130, 130, 130, 130, 130, 130, 130, 130, 130, 130, 130];
const BG_IMAGES_COUNT = 1;

const SOUNDS = {
    bgm: '/audio/bgm.mp3', move: '/audio/move.mp3', land: '/audio/land.mp3', single: '/audio/single.mp3', double: '/audio/double.mp3', triple: '/audio/triple.mp3',
    tetris: ['/audio/tetris1.mp3', '/audio/tetris2.mp3', '/audio/tetris3.mp3', '/audio/tetris4.mp3'], levelup: '/audio/levelup.mp3', lose: '/audio/lose.mp3', topout: '/audio/topout.mp3', ed: '/audio/ed.mp3', count: '/audio/count.mp3', select: '/audio/select.mp3'
};

const formatScore = (score) => {
    const s = parseInt(score) || 0;
    if (s < 1000000) return String(s).padStart(6, '0');
    // 1,000,000 -> A00,000 (Index 0)
    // 1,100,000 -> B00,000 (Index 1)
    const letterIdx = Math.floor((s - 1000000) / 100000);
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    if (letterIdx >= 0 && letterIdx < letters.length) {
        const remainder = s % 100000;
        return letters[letterIdx] + String(remainder).padStart(5, '0');
    }
    return String(s);
};

const MultiPlayerGame = ({ user, roomData, onBack }) => {
    const socket = useSocket();
    const gameScreenRef = useRef(null);
    const canvasRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
    const nextCanvasRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

    const [gameState, setGameState] = useState('LOBBY');
    const [preGameCount, setPreGameCount] = useState(3);
    const [gameOverCountdown, setGameOverCountdown] = useState(10);
    const [showTetrisCount, setShowTetrisCount] = useState(false);
    const [showTetrisGap, setShowTetrisGap] = useState(false);
    const [winner, setWinner] = useState(null);
    const [playerIndex, setPlayerIndex] = useState(-1);
    const [lobbyCountdown, setLobbyCountdown] = useState(-1);
    const [roomStats, setRoomStats] = useState({
        player_name: ['', '', '', ''],
        best_score: ['', '', '', ''],
        player_win: ['', '', '', ''],
        player_lose: ['', '', '', ''],
        player_tie: ['', '', '', ''],
        ready_level: [-1, -1, -1, -1]
    });
    const [selectedLevel, setSelectedLevel] = useState(roomData.level || 0);
    const [myGameOver, setMyGameOver] = useState(false);

    // High frequency data refs (Support 4 players)
    const playersData = [
        useRef({ grid: Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0)), score: 0, lines: 0, level: 0, hz: '0.00', nextBlockType: undefined, drt: 0, trt: 0, brn: 0, pos: { x: 5, y: 0 }, rotationIndex: 0, blockType: undefined, isGameOver: false, clearingLines: [], clearingPhase: -1, flashActive: false, flashFrameCounter: 0, flashWhiteIdx: 0, tetris19Num: 0, tetrisNum: 0, startWait: 0 }),
        useRef({ grid: Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0)), score: 0, lines: 0, level: 0, hz: '0.00', nextBlockType: undefined, drt: 0, trt: 0, brn: 0, pos: { x: 5, y: 0 }, rotationIndex: 0, blockType: undefined, isGameOver: false, clearingLines: [], clearingPhase: -1, flashActive: false, flashFrameCounter: 0, flashWhiteIdx: 0, tetris19Num: 0, tetrisNum: 0, startWait: 0 }),
        useRef({ grid: Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0)), score: 0, lines: 0, level: 0, hz: '0.00', nextBlockType: undefined, drt: 0, trt: 0, brn: 0, pos: { x: 5, y: 0 }, rotationIndex: 0, blockType: undefined, isGameOver: false, clearingLines: [], clearingPhase: -1, flashActive: false, flashFrameCounter: 0, flashWhiteIdx: 0, tetris19Num: 0, tetrisNum: 0, startWait: 0 }),
        useRef({ grid: Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0)), score: 0, lines: 0, level: 0, hz: '0.00', nextBlockType: undefined, drt: 0, trt: 0, brn: 0, pos: { x: 5, y: 0 }, rotationIndex: 0, blockType: undefined, isGameOver: false, clearingLines: [], clearingPhase: -1, flashActive: false, flashFrameCounter: 0, flashWhiteIdx: 0, tetris19Num: 0, tetrisNum: 0, startWait: 0 })
    ];

    // Internal game ref (If I am a player)
    const myGameRef = useRef({
        pos: { x: 5, y: 0 }, blockType: undefined, rotationIndex: 0, nextBlockType: undefined, seeds: [], seedIndex: 0, dropCounter: 0,
        grid: Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0)), score: 0, lines: 0, tetrisLines: 0, level: 0, startLevel: roomData.level || 0, bgCount: 0, oldLines: 0,
        advanceFirst: false, clearingLines: [], clearingPhase: -1, clearingTimer: 0, startWait: 0, startPreDropWait: 90, drt: 0, brn: 0, tetrisNum: 0, tetris19Num: 0,
        gameOverSoundTriggered: false, flashActive: false, flashFrameCounter: 0, flashWhiteIdx: 0, flashLevel: 0, keysDown: {}, dasCounter: 0, lastMoveDir: 0, isDashing: false, hz: '0.00', clickIntervals: [], downCounter: 0
    });

    const [uiStates, setUiStates] = useState([
        playersData[0].current,
        playersData[1].current,
        playersData[2].current,
        playersData[3].current
    ]);
    const roomStatsRef = useRef(roomStats);

    const playerRanks = React.useMemo(() => {
        const activeStates = [0, 1, 2, 3].map(i => ({
            index: i,
            name: roomStats.player_name[i],
            score: uiStates[i].score,
            level: uiStates[i].level
        })).filter(p => p.name !== '');

        if (activeStates.length < 1) return [];

        const sorted = [...activeStates].sort((a, b) => b.score - a.score);

        return sorted.map((p, i) => {
            let diff = 0;
            let tetrisDiff = 0;
            let diffColor = 'white';

            if (i === 0) {
                if (sorted.length > 1) {
                    diff = p.score - sorted[1].score;
                    const trailingLevel = sorted[1].level;
                    const tetrisScore = 1200 * (trailingLevel + 1);
                    tetrisDiff = diff / (tetrisScore || 1);
                    diffColor = '#0f0';
                }
            } else {
                diff = p.score - sorted[0].score;
                const myLevel = p.level;
                const tetrisScore = 1200 * (myLevel + 1);
                tetrisDiff = Math.abs(diff) / (tetrisScore || 1);
                diffColor = '#f00';
            }

            return {
                ...p,
                rank: i + 1,
                diff,
                tetrisDiff: tetrisDiff.toFixed(2),
                diffColor
            };
        });
    }, [uiStates, roomStats.player_name]);

    useEffect(() => { roomStatsRef.current = roomStats; }, [roomStats]);

    const audioRefs = useRef({});
    const whiteImages = useRef([]);
    const grayFlashImages = useRef([]);
    const grayBg = useRef(null);
    const loseImg = useRef(null);

    const playSound = (name, index = null) => {
        let audio = audioRefs.current[name];
        if (index !== null && Array.isArray(audio)) audio = audio[index];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => {
                if (e.name !== 'AbortError') console.error("Audio play failed:", e);
            });
        }
    };

    const collide = useCallback((coords, pos, grid) => {
        for (let coord of coords) {
            const px = coord[0] + pos.x, py = coord[1] + pos.y;
            if (px < 0 || px >= GRID_WIDTH || py >= GRID_HEIGHT || (py >= 0 && grid[py][px] !== 0)) return true;
        }
        return false;
    }, []);

    const drawCell = useCallback((ctx, x, y, typeIdx, level, size = BLOCK_SIZE, isGhost = false) => {
        if (typeIdx === 0) return;
        const colorIdx = typeIdx - 1;
        level = level % 10;
        const secondaryColor = COLOR_PALETTES[3][level];
        const baseColor = COLOR_PALETTES[colorIdx][level];
        const px = x * size, py = y * size;
        const pSize = size / 9;
        if (isGhost) { ctx.strokeStyle = 'rgb(120,120,120)'; ctx.lineWidth = 4; ctx.strokeRect(px + 2, py + 2, size - 4, size - 4); ctx.fillStyle = 'black'; ctx.fillRect(px + 4, py + 4, size - 8, size - 8); return; }
        ctx.fillStyle = (colorIdx === 0 || colorIdx === 1 || colorIdx === 6) ? secondaryColor : baseColor;
        ctx.fillRect(px, py, size, size);
        if (colorIdx === 0 || colorIdx === 1 || colorIdx === 6) { ctx.fillStyle = 'white'; ctx.fillRect(px + pSize, py + pSize, size - pSize * 3, size - pSize * 3); ctx.fillRect(px, py, pSize, pSize); }
        else if (!(level === 9 && (colorIdx === 2 || colorIdx === 4))) { ctx.fillStyle = 'white'; ctx.fillRect(px, py, pSize, pSize); ctx.fillRect(px + pSize, py + pSize, pSize, pSize); ctx.fillRect(px + pSize * 2, py + pSize, pSize, pSize); ctx.fillRect(px + pSize, py + pSize * 2, pSize, pSize); }
        ctx.fillStyle = 'black'; ctx.fillRect(px + size - pSize, py, pSize, size); ctx.fillRect(px, py + size - pSize, size, pSize);
    }, []);

    const drawGrid = (ctx, grid, level, clearingLines = [], clearingPhase = -1, flashActive = false, flashFrameCounter = 0) => {
        if (!grid || !Array.isArray(grid)) return;
        grid.forEach((row, y) => { row.forEach((value, x) => { if (value !== 0) { if (clearingPhase >= 0 && clearingLines.includes(y)) { if (Math.abs(x - 4.5) <= clearingPhase + 0.5) return; } if (flashActive && clearingLines.includes(y)) { if (Math.abs(x - 4.5) <= Math.floor((30 - flashFrameCounter) / 6) + 0.5) return; } drawCell(ctx, x, y, value, level); } }); });
    };

    const drawNext = useCallback((idx, typeIdx, level, size = 25) => {
        const nextCanvasRef = nextCanvasRefs[idx];
        if (!nextCanvasRef.current || typeIdx === undefined) return;
        const ctx = nextCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const rotations = BLOCKS_ROTATIONS[typeIdx].rotations[0];
        let minX = 10, maxX = -10, minY = 10, maxY = -10;
        rotations.forEach(c => { minX = Math.min(minX, c[0]); maxX = Math.max(maxX, c[0]); minY = Math.min(minY, c[1]); maxY = Math.max(maxY, c[1]); });
        const blockWidth = maxX - minX + 1, blockHeight = maxY - minY + 1;
        const offsetX = (ctx.canvas.width / size - blockWidth) / 2 - minX, offsetY = (ctx.canvas.height / size - blockHeight) / 2 - minY;
        rotations.forEach(c => drawCell(ctx, c[0] + offsetX, c[1] + offsetY, typeIdx + 1, level, size));
    }, [drawCell]);

    const drawBoard = (canvasRef, data) => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        const settings = JSON.parse(localStorage.getItem('tetris_settings') || '{}');

        if (data.level % 10 === 9 && grayBg.current && grayBg.current.complete) {
            ctx.drawImage(grayBg.current, 0, 0, ctx.canvas.width, ctx.canvas.height);
        } else {
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }

        if (data.flashActive) {
            const pass_frame = Math.floor(data.flashFrameCounter), cycle = (30 - pass_frame), clean_i = Math.floor(cycle / 3);
            if (clean_i % 2 === 0) {
                let img = (data.flashLevel % 10 === 9 && data.tetris19Num < 2) ? grayFlashImages.current[data.tetris19Num % 2] : whiteImages.current[data.flashWhiteIdx % 12];
                if (img && img.complete) ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
            } else {
                if (data.flashLevel % 10 === 9) { if (grayBg.current) ctx.drawImage(grayBg.current, 0, 0, ctx.canvas.width, ctx.canvas.height); }
                else { ctx.fillStyle = 'black'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); }
            }
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'; ctx.lineWidth = 1;
        for (let i = 0; i <= GRID_WIDTH; i++) { ctx.beginPath(); ctx.moveTo(i * BLOCK_SIZE, 0); ctx.lineTo(i * BLOCK_SIZE, GRID_HEIGHT * BLOCK_SIZE); ctx.stroke(); }
        for (let i = 0; i <= GRID_HEIGHT; i++) { ctx.beginPath(); ctx.moveTo(0, i * BLOCK_SIZE); ctx.lineTo(GRID_WIDTH * BLOCK_SIZE, i * BLOCK_SIZE); ctx.stroke(); }
        drawGrid(ctx, data.grid, data.level, data.clearingLines, data.clearingPhase, data.flashActive, data.flashFrameCounter);

        if (!data.isGameOver && !data.flashActive && data.clearingPhase === -1 && data.blockType !== undefined && (data.startWait === undefined || data.startWait <= 0)) {
            const coords = BLOCKS_ROTATIONS[data.blockType].rotations[data.rotationIndex];

            // Preview / Ghost Piece
            if (settings.show_preview !== '0') {
                let ghostY = data.pos.y;
                while (!collide(coords, { x: data.pos.x, y: ghostY + 1 }, data.grid)) ghostY++;
                coords.forEach(c => drawCell(ctx, c[0] + data.pos.x, c[1] + ghostY, data.blockType + 1, data.level, BLOCK_SIZE, true));
            }

            coords.forEach(c => drawCell(ctx, c[0] + data.pos.x, c[1] + data.pos.y, data.blockType + 1, data.level));
        }
        if (data.isGameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            if (loseImg.current && loseImg.current.complete) {
                const imgW = 280, imgH = 100;
                ctx.drawImage(loseImg.current, (ctx.canvas.width - imgW) / 2, (ctx.canvas.height - imgH) / 2, imgW, imgH);
            }
        }
    };

    const draw = useCallback(() => {
        playersData.forEach((pRef, idx) => {
            drawBoard(canvasRefs[idx], pRef.current);
        });
    }, [drawBoard]);

    const spawnBlock = useCallback(() => {
        const g = myGameRef.current; if (g.seeds.length === 0 || g.gameOverSoundTriggered) return;
        g.blockType = g.blockType === undefined ? g.seeds[g.seedIndex++ % g.seeds.length] % 7 : g.nextBlockType; g.nextBlockType = g.seeds[g.seedIndex++ % g.seeds.length] % 7;
        g.pos = { x: 5, y: 0 }; g.rotationIndex = 0; g.drt = g.blockType === 0 ? 0 : g.drt + 1;
        g.downCounter = 0; g.dropCounter = 0;
        if (collide(BLOCKS_ROTATIONS[g.blockType].rotations[g.rotationIndex], g.pos, g.grid)) {
            if (audioRefs.current.bgm) audioRefs.current.bgm.pause(); g.gameOverSoundTriggered = true; setMyGameOver(true);
            playSound('topout'); playSound('lose'); playSound('ed');

            if (playerIndex >= 0 && playerIndex < 4) {
                const myRef = playersData[playerIndex];
                myRef.current = { ...myRef.current, isGameOver: true };
                setUiStates(prev => {
                    const newState = [...prev];
                    newState[playerIndex] = { ...myRef.current };
                    return newState;
                });
            }

            if (socket) {
                socket.emit('gameover', { room_num: roomData.roomNum, uid: user.account });
                const currentRoomStats = roomStatsRef.current;

                // 檢查是否所有玩家都掛了
                const playersInRoom = currentRoomStats.player_name.filter(name => name !== '');
                const alivePlayers = playersInRoom.filter((name, idx) => {
                    if (name === user.account) return false; // I just died
                    return !playersData[idx].current.isGameOver;
                });

                if (alivePlayers.length === 0) {
                    // Everyone dead, leader tells server to finalize
                    socket.emit('request_gameover_sync', { room_num: roomData.roomNum });
                }
            }
            return;
        }
        drawNext(playerIndex, g.nextBlockType, g.level, isFinite(g.level) ? 25 : 25); // Just ensuring size
    }, [drawNext, collide, roomData.roomNum, socket, user.account, playerIndex]);

    const merge = useCallback(() => {
        const g = myGameRef.current; if (g.clearingPhase >= 0 || g.flashActive || g.gameOverSoundTriggered) return;
        const newGrid = g.grid.map(row => [...row]);
        BLOCKS_ROTATIONS[g.blockType].rotations[g.rotationIndex].forEach(c => { const py = c[1] + g.pos.y, px = c[0] + g.pos.x; if (py >= 0 && py < GRID_HEIGHT && px >= 0 && px < GRID_WIDTH) newGrid[py][px] = g.blockType + 1; });
        let cleared = 0, cleanLines = []; for (let y = GRID_HEIGHT - 1; y >= 0; y--) { if (newGrid[y].every(cell => cell !== 0)) { cleanLines.push(y); cleared++; } }
        if (cleared > 0) {
            g.clearingLines = cleanLines;
            if (cleared === 4) { g.flashActive = true; g.flashFrameCounter = 30; g.flashLevel = g.level; if (g.level % 10 === 9 && g.tetris19Num < 2) playSound('tetris', g.tetris19Num + 2); else playSound('tetris', g.tetrisNum); g.brn = 0; g.tetrisLines += 4; }
            else { g.clearingPhase = 0; g.clearingTimer = 0; if (cleared === 1) playSound('single'); else if (cleared === 2) playSound('double'); else if (cleared === 3) playSound('triple'); g.brn++; }
            g.score += [0, 40, 100, 300, 1200][cleared] * (g.level + 1); g.lines += cleared;
            const prevLvl = g.level;
            const threshold = g.advanceFirst ? 10 : (ADVANCE_LINES[g.startLevel] || 10);
            if (g.lines >= (g.advanceFirst ? g.oldLines : 0) + threshold) {
                if (!g.advanceFirst) { g.oldLines = threshold; g.advanceFirst = true; }
                else { g.oldLines += 10; }
                g.level++;
                if (g.level > prevLvl) playSound('levelup');
            }
            g.startWait = 18;
            if (playerIndex >= 0 && playerIndex < 4) {
                const myRef = playersData[playerIndex];
                myRef.current = { ...myRef.current, score: g.score, lines: g.lines, level: g.level, brn: g.brn, trt: Math.round((g.tetrisLines / (g.lines || 1)) * 100) };
                setUiStates(prev => {
                    const newState = [...prev];
                    newState[playerIndex] = { ...myRef.current };
                    return newState;
                });
            }
        } else { playSound('land'); g.startWait = 18; g.dropCounter = 0; spawnBlock(); }
        g.grid = newGrid;
    }, [playSound, collide, spawnBlock]);

    useEffect(() => {
        Object.entries(SOUNDS).forEach(([key, value]) => {
            if (Array.isArray(value)) audioRefs.current[key] = value.map(src => new Audio(src));
            else {
                audioRefs.current[key] = new Audio(value);
                if (key === 'bgm' || key === 'select') {
                    audioRefs.current[key].loop = true;
                    if (key === 'bgm') audioRefs.current[key].volume = 0.5;
                }
            }
        });
        for (let i = 1; i <= 12; i++) { const img = new Image(); const ext = [12, 3, 4, 6, 8].includes(i) ? 'png' : 'jpg'; img.src = `/img_multi/white${i}.${ext}`; whiteImages.current.push(img); }
        const g1 = new Image(); g1.src = '/img_multi/gray1.png'; const g2 = new Image(); g2.src = '/img_multi/gray2.jpg';
        grayFlashImages.current = [g1, g2];
        grayBg.current = new Image(); grayBg.current.src = '/img_multi/gray.jpg';
        loseImg.current = new Image(); loseImg.current.src = '/img_multi/lose.png';

        if (gameState === 'LOBBY') {
            const playSelect = () => {
                if (audioRefs.current.select) {
                    audioRefs.current.select.play().catch(e => {
                        if (e.name !== 'AbortError') console.error("Select audio play failed:", e);
                    });
                }
            };
            playSelect();
        }

        return () => {
            Object.values(audioRefs.current).forEach(audio => {
                if (Array.isArray(audio)) audio.forEach(a => { a.pause(); a.currentTime = 0; });
                else {
                    audio.pause();
                    audio.currentTime = 0;
                }
            });
        };
    }, []);

    const handleReady = () => { if (socket && playerIndex !== -1) socket.emit('room_ready', { uid: user.account, room_num: roomData.roomNum, player_index: playerIndex, level: selectedLevel }); };
    const handleCancelReady = () => { if (socket && playerIndex !== -1) socket.emit('room_ready', { uid: user.account, room_num: roomData.roomNum, player_index: playerIndex, level: -1 }); };

    useEffect(() => {
        if (socket) {
            socket.on('room_locked_error', (data) => { alert(data.msg); onBack(); });

            socket.on('connect', () => {
                socket.emit('register_player', { uid: user.account, room_num: roomData.roomNum, best_score: roomData.stats.best, player_win: roomData.stats.win, player_lose: roomData.stats.lose, player_tie: roomData.stats.tie });
            });

            socket.on('in_room', (data) => {
                setRoomStats(data);
                roomStatsRef.current = data;
                const myAcc = user.account.trim();
                const myIdx = data.player_name.map(n => n.trim()).indexOf(myAcc);
                if (myIdx !== -1) setPlayerIndex(myIdx);

                // Clear state for empty slots immediately
                const empty = { grid: Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0)), score: 0, lines: 0, level: 0, hz: '0.00', nextBlockType: undefined, drt: 0, trt: 0, brn: 0, pos: { x: 5, y: 0 }, rotationIndex: 0, blockType: undefined, isGameOver: false, clearingLines: [], clearingPhase: -1, flashActive: false };
                data.player_name.forEach((name, idx) => {
                    if (name === '' && idx < 4) playersData[idx].current = empty;
                });
                setUiStates(playersData.map(p => p.current));
            });

            socket.on('play_ready', (data) => { setRoomStats(prev => ({ ...prev, ready_level: data.ready_level })); });
            socket.on('get_random_block', (data) => { myGameRef.current.seeds = data.random_block; setPreGameCount(3); setGameState('COUNTING'); });

            socket.on('tetris_client_block', (data) => {
                if (data.uid === user.account) return;
                const targetIdx = roomStatsRef.current.player_name.indexOf(data.uid); if (targetIdx === -1 || targetIdx >= 4) return;
                const ref = playersData[targetIdx]; ref.current = { ...ref.current, ...data };
                setUiStates(prev => {
                    const newState = [...prev];
                    newState[targetIdx] = { ...ref.current };
                    return newState;
                });
                drawNext(targetIdx, data.nextBlockType, data.level, 25);
            });

            socket.on('client_gameover', (data) => {
                if (data.uid === user.account) return;
                const currentRoomStats = roomStatsRef.current;
                const targetIdx = currentRoomStats.player_name.indexOf(data.uid); if (targetIdx === -1 || targetIdx >= 4) return;
                const ref = playersData[targetIdx]; ref.current.isGameOver = true;
                setUiStates(prev => {
                    const newState = [...prev];
                    newState[targetIdx] = { ...ref.current };
                    return newState;
                });

                const myIdx = currentRoomStats.player_name.indexOf(user.account);
                const amIPlayer = (myIdx >= 0 && myIdx < 4);
                const playersInRoom = currentRoomStats.player_name.filter(name => name !== '');
                const alivePlayers = playersInRoom.filter((name, idx) => !playersData[idx].current.isGameOver);
            });

            socket.on('gameover_sync', () => {
                const currentRoomStats = roomStatsRef.current;
                const scores = currentRoomStats.player_name
                    .map((name, i) => ({ name, score: playersData[i].current.score }))
                    .filter(p => p.name !== '');

                scores.sort((a, b) => b.score - a.score);
                const myIdx = currentRoomStats.player_name.indexOf(user.account);
                const amIPlayer = (myIdx >= 0 && myIdx < 4);

                if (amIPlayer) {
                    const myScore = playersData[myIdx].current.score;
                    const topScore = scores[0].score;
                    const isTop = (myScore === topScore);
                    const othersWithTop = scores.filter(p => p.name !== user.account && p.score === topScore);

                    if (isTop) {
                        if (othersWithTop.length > 0) setWinner('TIE');
                        else setWinner('WIN');
                    } else {
                        setWinner('LOSE');
                    }
                } else {
                    setWinner('GAMEOVER');
                }
                setGameOverCountdown(10);
                setGameState('GAMEOVER');
            });

            socket.emit('register_player', { uid: user.account, room_num: roomData.roomNum, best_score: roomData.stats.best, player_win: roomData.stats.win, player_lose: roomData.stats.lose, player_tie: roomData.stats.tie });
        }
        return () => {
            if (socket) {
                if (roomData.roomNum !== -1) socket.emit('leave_room', { uid: user.account, room_num: roomData.roomNum });
                socket.off('connect');
                socket.off('in_room');
                socket.off('play_ready');
                socket.off('get_random_block');
                socket.off('tetris_client_block');
                socket.off('client_gameover');
                socket.off('room_locked_error');
            }
        };
    }, []);

    useEffect(() => {
        if (gameState === 'GAMEOVER' && playerIndex !== -1 && playerIndex < 4) {
            const myScore = playersData[playerIndex].current.score;
            let winStatus = '2'; // Default lose
            if (winner === 'WIN') winStatus = '1';
            else if (winner === 'TIE') winStatus = '0';

            const recordScore = async () => {
                try {
                    const formData = new FormData();
                    formData.append('account', user.account);
                    formData.append('score', myScore);
                    formData.append('win_lose', winStatus);
                    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
                    await fetch(`${baseUrl}/record`, { method: 'POST', body: formData });
                } catch (e) { console.error("Score recording failed:", e); }
            };
            recordScore();
        }
    }, [gameState, winner, playerIndex, user.account]);

    useEffect(() => {
        if (gameState === 'LOBBY') {
            const playersInSlots = roomStats.player_name.filter((name, i) => i < 4 && name !== '');
            const allReady = playersInSlots.length >= 2 && playersInSlots.every((_, i) => roomStats.ready_level[i] !== -1);

            if (allReady) {
                if (lobbyCountdown === -1) {
                    setLobbyCountdown(10);
                }
            } else {
                setLobbyCountdown(-1);
            }
        }
    }, [roomStats.ready_level, gameState]);

    useEffect(() => {
        let timer;
        if (gameState === 'LOBBY' && lobbyCountdown > 0) {
            timer = setInterval(() => {
                setLobbyCountdown(prev => prev - 1);
            }, 1000);
        } else if (gameState === 'LOBBY' && lobbyCountdown === 0) {
            if (playerIndex === 0) {
                const seeds = Array.from({ length: 1000 }, () => Math.floor(Math.random() * 1000));
                socket.emit('send_random_block', { room_num: roomData.roomNum, random_block: seeds });
            }
            setLobbyCountdown(-1);
        }
        return () => clearInterval(timer);
    }, [gameState, lobbyCountdown, playerIndex, socket, roomData.roomNum]);

    useEffect(() => {
        if (gameState === 'COUNTING') {
            const playersInSlots = roomStats.player_name.filter((name, i) => i < 4 && name !== '');
            const anyNotReady = playersInSlots.some((_, i) => roomStats.ready_level[i] === -1);
            if (anyNotReady) { setGameState('LOBBY'); setPreGameCount(3); }
        }
    }, [roomStats.ready_level, gameState]);

    useEffect(() => {
        let timer;
        if (gameState === 'COUNTING') {
            if (audioRefs.current.select) { audioRefs.current.select.pause(); audioRefs.current.select.currentTime = 0; }
            playSound('count');
            setPreGameCount(3);
            if (playerIndex >= 0 && playerIndex < 4) {
                const g = myGameRef.current;
                g.level = selectedLevel;
                g.startLevel = selectedLevel;
                g.score = 0; g.lines = 0; g.tetrisLines = 0; g.oldLines = 0; g.advanceFirst = false;
                g.grid = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0));
                g.startPreDropWait = 90; g.startWait = 0; g.gameOverSoundTriggered = false; g.blockType = undefined; g.nextBlockType = undefined; g.seedIndex = 0;

                const myRef = playersData[playerIndex];
                myRef.current = { ...myRef.current, score: 0, lines: 0, level: selectedLevel, grid: g.grid, isGameOver: false, blockType: undefined, nextBlockType: undefined };
                setUiStates(prev => {
                    const newState = [...prev];
                    newState[playerIndex] = { ...myRef.current };
                    return newState;
                });
            }

            timer = setInterval(() => {
                setPreGameCount(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setGameState('PLAYING');
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
    }, [gameState, selectedLevel, playerIndex]);

    useEffect(() => {
        const timer = setInterval(() => {
            setShowTetrisCount(prev => !prev);
            setShowTetrisGap(prev => !prev);
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let timer;
        if (gameState === 'GAMEOVER') {
            timer = setInterval(() => {
                setGameOverCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        onBack();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameState, onBack]);

    useEffect(() => {
        const tickRate = 1000 / 60; let lastTimestamp = performance.now(); let accumulator = 0; let animationFrameId;
        const pollGamepad = () => {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            const config = JSON.parse(localStorage.getItem('tetris_settings') || '{}');
            const g = myGameRef.current;

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
            const g = myGameRef.current; const deltaTime = time - lastTimestamp; lastTimestamp = time;
            if (gameState === 'PLAYING') {
                accumulator += deltaTime;
                while (accumulator >= tickRate) {
                    pollGamepad();
                    g.bgCount++; if (g.bgCount >= 80) g.bgCount = 0;
                    if (playerIndex >= 0 && playerIndex < 4 && !myGameOver) {
                        const myRef = playersData[playerIndex];
                        myRef.current = { ...myRef.current, grid: g.grid, score: g.score, lines: g.lines, level: g.level, hz: g.hz, nextBlockType: g.nextBlockType, drt: g.drt, trt: Math.round((g.tetrisLines / (g.lines || 1)) * 100), brn: g.brn, pos: g.pos, rotationIndex: g.rotationIndex, blockType: g.blockType, clearingLines: g.clearingLines, clearingPhase: g.clearingPhase, flashActive: g.flashActive, flashFrameCounter: g.flashFrameCounter, flashWhiteIdx: g.flashWhiteIdx, flashLevel: g.flashLevel, tetris19Num: g.tetris19Num, tetrisNum: g.tetrisNum, startWait: g.startWait, isGameOver: myGameOver };

                        if (g.bgCount % 3 === 0) {
                            setUiStates(prev => {
                                const newState = [...prev];
                                newState[playerIndex] = { ...myRef.current };
                                return newState;
                            });
                            const now = performance.now(); g.clickIntervals = g.clickIntervals.filter(t => now - t < 1000);
                            g.hz = g.clickIntervals.length.toFixed(2);
                            socket.emit('tetris_server_block', { room_num: roomData.roomNum, uid: user.account, grid: g.grid, score: g.score, lines: g.lines, level: g.level, hz: g.hz, nextBlockType: g.nextBlockType, drt: g.drt, trt: Math.round((g.tetrisLines / (g.lines || 1)) * 100), brn: g.brn, pos: g.pos, rotationIndex: g.rotationIndex, blockType: g.blockType, clearingLines: g.clearingLines, clearingPhase: g.clearingPhase, flashActive: g.flashActive, flashFrameCounter: g.flashFrameCounter, flashWhiteIdx: g.flashWhiteIdx, flashLevel: g.flashLevel, tetris19Num: g.tetris19Num, tetrisNum: g.tetrisNum, startWait: g.startWait });
                        }
                    }
                    if (!myGameOver) {
                        if (g.flashActive) { g.flashFrameCounter--; if (g.flashFrameCounter <= 0) { g.flashActive = false; if (g.level % 10 === 9 && g.tetris19Num < 2) g.tetris19Num++; else { g.flashWhiteIdx++; if (g.flashWhiteIdx >= 12) g.flashWhiteIdx = 0; g.tetrisNum = 1 - g.tetrisNum; } const newGrid = g.grid.filter((_, y) => !g.clearingLines.includes(y)); while (newGrid.length < GRID_HEIGHT) newGrid.unshift(Array(GRID_WIDTH).fill(0)); g.grid = newGrid; g.clearingLines = []; spawnBlock(); } }
                        else if (g.clearingPhase >= 0) { g.clearingTimer += tickRate; if (g.clearingTimer > 60) { g.clearingPhase++; g.clearingTimer = 0; if (g.clearingPhase > 4) { const newGrid = g.grid.filter((_, y) => !g.clearingLines.includes(y)); while (newGrid.length < GRID_HEIGHT) newGrid.unshift(Array(GRID_WIDTH).fill(0)); g.grid = newGrid; g.clearingPhase = -1; g.clearingLines = []; spawnBlock(); } } }
                        else {
                            if (g.blockType !== undefined) {
                                const config = JSON.parse(localStorage.getItem('tetris_settings') || '{}');
                                const leftKey = (config.Left || 'arrowleft').toLowerCase(), rightKey = (config.Right || 'arrowright').toLowerCase();
                                const downKey = (config.Down || 'arrowdown').toLowerCase();

                                // Horizontal Move (DAS)
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

                                // Soft Drop (No DAS)
                                if (g.keysDown[downKey] && g.startPreDropWait <= 0 && g.startWait <= 0 && g.blockType !== undefined) {
                                    g.downCounter++;
                                    if (g.downCounter >= 2) { // 30Hz soft drop
                                        handleSoftDrop();
                                        g.downCounter = 0;
                                    }
                                } else {
                                    g.downCounter = 0;
                                }
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
        animationFrameId = requestAnimationFrame(animate); return () => { cancelAnimationFrame(animationFrameId); };
    }, [gameState, myGameOver, playerIndex]);

    const handleSoftDrop = useCallback(() => {
        const g = myGameRef.current;
        if (g.blockType === undefined) return;
        const coords = BLOCKS_ROTATIONS[g.blockType].rotations[g.rotationIndex];
        g.pos.y++; g.dropCounter = 0;
        if (collide(coords, g.pos, g.grid)) { g.pos.y--; merge(); }
    }, [collide, merge]);

    const handleHardDrop = useCallback(() => {
        const g = myGameRef.current;
        if (g.blockType === undefined) return;
        const coords = BLOCKS_ROTATIONS[g.blockType].rotations[g.rotationIndex];
        while (!collide(coords, { x: g.pos.x, y: g.pos.y + 1 }, g.grid)) g.pos.y++;
        merge();
    }, [collide, merge]);

    const handleRotateLeft = useCallback(() => {
        const g = myGameRef.current;
        if (g.blockType === undefined) return;
        const nextRot = (g.rotationIndex + 1) % BLOCKS_ROTATIONS[g.blockType].num;
        if (!collide(BLOCKS_ROTATIONS[g.blockType].rotations[nextRot], g.pos, g.grid)) { g.rotationIndex = nextRot; playSound('move'); }
    }, [collide, playSound]);

    const handleRotateRight = useCallback(() => {
        const g = myGameRef.current;
        if (g.blockType === undefined) return;
        const nextRot = (g.rotationIndex - 1 + BLOCKS_ROTATIONS[g.blockType].num) % BLOCKS_ROTATIONS[g.blockType].num;
        if (!collide(BLOCKS_ROTATIONS[g.blockType].rotations[nextRot], g.pos, g.grid)) { g.rotationIndex = nextRot; playSound('move'); }
    }, [collide, playSound]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const g = myGameRef.current; const k = (e.key === ' ' ? 'space' : e.key).toLowerCase(); g.keysDown[k] = true;
            if (gameState !== 'PLAYING' || myGameOver || g.clearingPhase >= 0 || g.flashActive || g.blockType === undefined) return;
            const config = JSON.parse(localStorage.getItem('tetris_settings') || '{}');
            const leftKey = (config.Left || 'arrowleft').toLowerCase(), rightKey = (config.Right || 'arrowright').toLowerCase();
            if (!e.repeat && (k === leftKey || k === rightKey)) g.clickIntervals.push(performance.now());
            const keys = { down: (config.Down || 'arrowdown').toLowerCase(), drop: (config.Drop || 'space').toLowerCase(), rotateR: (config['Rotate-Right'] || 'z').toLowerCase(), rotateL: (config['Rotate-Left'] || 'x').toLowerCase() };
            if (g.startPreDropWait <= 0 && g.startWait <= 0) {
                if (k === keys.drop && !e.repeat) handleHardDrop();
            }
            if (k === keys.rotateL) handleRotateLeft();
            if (k === keys.rotateR) handleRotateRight();
        };
        const handleKeyUp = (e) => { myGameRef.current.keysDown[(e.key === ' ' ? 'space' : e.key).toLowerCase()] = false; }; window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp); return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, [gameState, myGameOver]);

    const getRankIcon = (name, score, leader) => {
        const acc = (name || '').trim();
        const best = parseInt(score) || 0;
        const rankIdx = (leader || []).findIndex(p => p.name.trim() === acc);
        if (rankIdx >= 0 && rankIdx < 5) return `/img_multi/${rankIdx + 1}.png`;
        if (best < 10000) return '/img_multi/bronze.png';
        if (best < 50000) return '/img_multi/silver.png';
        if (best < 100000) return '/img_multi/gold.png';
        if (best < 200000) return '/img_multi/diamond.png';
        if (best < 500000) return '/img_multi/s.png';
        if (best < 750000) return '/img_multi/ss.png';
        if (best < 1000000) return '/img_multi/sss.png';
        return '/img_multi/ssss.png';
    };


    const renderPlayerInfo = (idx) => {
        const name = roomStats.player_name[idx];
        if (name === '') return (
            <div style={{ width: '220px', height: '280px', border: '2px dashed #444', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#444' }}>
                Empty
            </div>
        );
        const best = roomStats.best_score[idx] || 0;
        const isMe = idx === playerIndex;
        return (
            <div style={{
                width: '220px',
                fontFamily: '"Press Start 2P"',
                background: isMe ? 'rgba(0, 245, 255, 0.15)' : 'rgba(255,255,255,0.05)',
                padding: '15px',
                borderRadius: '10px',
                position: 'relative',
                border: isMe ? '2px solid var(--text-cyan)' : '2px solid transparent'
            }}>
                <div style={{ color: 'yellow', fontSize: '1rem', marginBottom: '10px' }}>
                    Player{idx + 1} {isMe && <span style={{ color: 'var(--text-cyan)', fontSize: '0.6rem' }}>(YOU)</span>}
                </div>
                <div style={{ color: 'white', fontSize: '0.9rem', marginBottom: '15px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <img src={getRankIcon(name, best, roomData.leaderboard)} alt="rank" style={{ width: '40px', height: '40px' }} />
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ color: 'cyan', fontSize: '0.7rem', marginBottom: '5px' }}>Best</div>
                        <div style={{ color: 'white', fontSize: '0.8rem' }}>{formatScore(best)}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', color: 'white', fontSize: '0.7rem', marginTop: '15px' }}>
                    <span style={{ color: 'red' }}>W:{roomStats.player_win[idx] || 0}</span>
                    <span style={{ color: 'cyan' }}>L:{roomStats.player_lose[idx] || 0}</span>
                </div>
                <div style={{ marginTop: '15px', fontSize: '0.8rem' }}>
                    <span style={{ color: 'cyan' }}>Lv: </span>
                    <span style={{ color: 'white' }}>{roomStats.ready_level[idx] !== -1 ? roomStats.ready_level[idx] : (idx === playerIndex ? selectedLevel : '0')}</span>
                </div>
                {roomStats.ready_level[idx] !== -1 && <div style={{ position: 'absolute', top: '10px', right: '10px', color: '#0f0', fontSize: '0.7rem' }}>READY</div>}
            </div>
        );
    };

    const renderLobby = () => {
        const playersInSlots = roomStats.player_name.filter((name, i) => i < 4 && name !== '');
        const allReady = playersInSlots.length >= 2 && playersInSlots.every((_, i) => roomStats.ready_level[i] !== -1);

        return (
            <div className="lobby-overlay" style={{ position: 'absolute', inset: 0, background: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', color: 'white', fontFamily: '"Press Start 2P"' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'red', fontSize: '1.1rem' }}>Room ID : {roomData.roomNum}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', width: '100%', gap: '60px', flexGrow: 1 }}>
                    {/* Left: Level Selection */}
                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="level-header-container" style={{ textAlign: 'center' }}>
                            <h1 className="tetris-color-cycle" style={{ fontSize: '3.5rem', margin: 0 }}>TETRIS</h1>
                            <h2 style={{ fontSize: '1.5rem', color: 'white', margin: '40px 0 10px 0' }}>LEVEL</h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 70px)', gap: '25px 15px', textAlign: 'center', fontSize: '1.4rem' }}>
                            {[...Array(20).keys(), "", "", 29].map((lv, idx) => (
                                <div key={idx}
                                    onClick={() => lv !== "" && playerIndex !== -1 && playerIndex < 4 && roomStats.ready_level[playerIndex] === -1 && setSelectedLevel(lv)}
                                    style={{ cursor: lv !== "" ? 'pointer' : 'default', color: selectedLevel === lv ? 'cyan' : 'white', padding: '10px', border: selectedLevel === lv ? '2px solid cyan' : '2px solid transparent' }}>
                                    {lv}
                                </div>
                            ))}
                        </div>
                        {lobbyCountdown !== -1 && (
                            <div style={{ color: 'red', marginTop: '15px', fontSize: '0.8rem', textAlign: 'center', lineHeight: '1.5' }}>
                                ALL PLAYERS READY!<br />GAME STARTS IN {lobbyCountdown} SECONDS
                            </div>
                        )}
                        <div style={{ marginTop: 'auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div onClick={onBack} style={{ cursor: 'pointer', fontSize: '1.2rem', color: 'white' }}>BACK</div>
                            {playerIndex !== -1 && playerIndex < 4 && (
                                <button onClick={roomStats.ready_level[playerIndex] === -1 ? handleReady : handleCancelReady}
                                    style={{ background: 'none', border: '3px solid white', color: roomStats.ready_level[playerIndex] === -1 ? 'white' : '#ff4444', padding: '10px 30px', fontSize: '1.2rem', fontFamily: '"Press Start 2P"', cursor: 'pointer' }}>
                                    {roomStats.ready_level[playerIndex] === -1 ? 'READY' : 'CANCEL'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right: Players List */}
                    <div style={{ width: '500px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {[0, 1, 2, 3].map(idx => renderPlayerInfo(idx))}
                        <div style={{ gridColumn: 'span 2', textAlign: 'center', marginTop: 'auto', color: 'yellow', fontSize: '0.8rem' }}>
                            {allReady ? (lobbyCountdown !== -1 ? `Starting in ${lobbyCountdown}s...` : "Preparing...") : "Wait for all players to be ready"}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Calculate in-game rankings and score gaps
    const activePlayersMatch = uiStates.map((p, i) => ({
        ...p,
        idx: i,
        name: roomStats.player_name[i]
    })).filter(p => p.name !== '');

    activePlayersMatch.sort((a, b) => b.score - a.score);
    const ranksMap = {};
    activePlayersMatch.forEach((p, i) => { ranksMap[p.idx] = i + 1; });

    const topPlayer = activePlayersMatch[0];
    const runnerUp = activePlayersMatch[1] || activePlayersMatch[0];
    const topScoreVal = topPlayer?.score || 0;
    const runnerUpScoreVal = runnerUp?.score || 0;
    const runnerUpLevelVal = runnerUp?.level || 0;

    const renderPlayerModule = (pos, isLocal = false) => {
        const data = uiStates[pos];
        const name = roomStats.player_name[pos] || 'Waiting...';
        const canvas = canvasRefs[pos];
        const nextCanvas = nextCanvasRefs[pos];
        const scale = isLocal ? 1 : 0.4; // Reduced scale for other players

        const currentRank = ranksMap[pos] || '-';
        const isLeader = currentRank === 1;
        const gapVal = isLeader ? (data.score - runnerUpScoreVal) : (topScoreVal - data.score);
        const targetLvl = isLeader ? runnerUpLevelVal : data.level; // Use trailing player's level
        const tetrisScore = 1200 * (targetLvl + 1);
        const tGap = (gapVal / (tetrisScore || 1)).toFixed(2);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isLocal ? '10px' : '5px' }}>
                <div style={{ color: 'white', fontFamily: '"Press Start 2P"', fontSize: isLocal ? '1.2rem' : '0.8rem' }}>{name}</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: isLocal ? '12px' : '6px' }}>
                    {/* Compact stats on the left of board */}
                    <div style={{ width: isLocal ? '100px' : '50px', display: 'flex', flexDirection: 'column', gap: isLocal ? '15px' : '5px', fontFamily: '"Press Start 2P"', color: 'white', fontSize: isLocal ? '0.8rem' : '0.5rem', textAlign: 'right' }}>
                        <div>DRT</div><div style={{ color: data.drt > 12 ? 'red' : 'white' }}>{String(data.drt).padStart(3, '0')}</div>
                        <div>TRT</div><div>{data.trt}%</div>
                        <div>BRN</div><div>{String(data.brn).padStart(3, '0')}</div>
                    </div>

                    <div className="canvas-container" style={{
                        width: `${BLOCK_SIZE * GRID_WIDTH * scale}px`,
                        height: `${BLOCK_SIZE * GRID_HEIGHT * scale}px`,
                        border: isLocal ? '4px solid #777' : '2px solid #555',
                        background: '#000',
                        position: 'relative',
                        overflow: 'hidden',
                        padding: 0
                    }}>
                        <canvas
                            ref={canvas}
                            width={BLOCK_SIZE * GRID_WIDTH}
                            height={BLOCK_SIZE * GRID_HEIGHT}
                            style={{
                                transform: `scale(${scale})`,
                                transformOrigin: 'top left',
                                position: 'absolute',
                                top: 0,
                                left: 0
                            }}
                        />
                    </div>

                    {/* Compact stats on the right of board */}
                    <div style={{ width: isLocal ? '105px' : '70px', display: 'flex', flexDirection: 'column', gap: isLocal ? '15px' : '5px', fontFamily: '"Press Start 2P"', color: 'white', fontSize: isLocal ? '0.8rem' : '0.5rem' }}>
                        <div>SCORE</div><div style={{ fontSize: isLocal ? '0.9rem' : '0.6rem' }}>{formatScore(data.score)}</div>
                        <div>NEXT</div>
                        <div style={{
                            height: isLocal ? '90px' : '54px',
                            width: isLocal ? '120px' : '72px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            border: '1px solid #333',
                            background: '#000'
                        }}>
                            <canvas
                                ref={nextCanvas}
                                width="120"
                                height="90"
                                style={{
                                    width: isLocal ? '120px' : '72px',
                                    height: isLocal ? '90px' : '54px'
                                }}
                            />
                        </div>
                        <div>LEVEL</div><div>{String(data.level).padStart(2, '0')}</div>
                        <div style={{ marginTop: '5px' }}>{data.hz} HZ</div>
                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px', borderTop: '1px solid #333', paddingTop: '5px' }}>
                            <div style={{ color: 'yellow', fontSize: isLocal ? '0.7rem' : '0.45rem' }}>RANK {currentRank}</div>
                            <div style={{
                                color: isLeader ? '#0f0' : '#f00',
                                fontSize: isLocal ? '0.65rem' : '0.45rem',
                                whiteSpace: 'nowrap'
                            }}>
                                {showTetrisCount ?
                                    `${isLeader ? '+' : '-'}${tGap}T` :
                                    `${isLeader ? '+' : '-'}${formatScore(gapVal)}`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="game-screen" ref={gameScreenRef} style={{ backgroundImage: 'url(/img_multi/bg1.jpg)', backgroundSize: 'cover' }}>
            {gameState === 'LOBBY' && roomData.roomNum !== -1 && renderLobby()}
            {gameState === 'COUNTING' && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: '#000',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10000
                }}>
                    <div style={{
                        fontSize: '120px',
                        color: '#fff',
                        fontFamily: '"Press Start 2P"',
                        textShadow: '5px 5px #000'
                    }}>
                        {preGameCount > 0 ? preGameCount : ''}
                    </div>
                </div>
            )}
            {/* Main Game Layout Container */}
            <div style={{ display: 'flex', width: '100vw', height: '100vh', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, padding: '10px', boxSizing: 'border-box', overflow: 'hidden' }}>
                {(() => {
                    const otherPlayers = [0, 1, 2, 3].filter(i => i !== playerIndex && roomStats.player_name[i] !== '');
                    return (
                        <>
                            {/* Left Side: Up to 2 others */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: '0 1 auto', minWidth: '150px', alignItems: 'center', justifyContent: 'center' }}>
                                {otherPlayers[0] !== undefined && renderPlayerModule(otherPlayers[0], false)}
                                {otherPlayers[1] !== undefined && renderPlayerModule(otherPlayers[1], false)}
                            </div>

                            {/* Center: Local Player */}
                            <div style={{ flex: '0 1 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: '380px' }}>
                                {playerIndex !== -1 && playerIndex < 4 && renderPlayerModule(playerIndex, true)}
                            </div>

                            {/* Right Side: 1 other */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: '0 1 auto', minWidth: '150px', alignItems: 'center', justifyContent: 'center' }}>
                                {otherPlayers[2] !== undefined && renderPlayerModule(otherPlayers[2], false)}
                                {gameState === 'PLAYING' && playerRanks.length > 0 && (
                                    <div style={{
                                        marginTop: '10px',
                                        width: '200px',
                                        padding: '10px 15px',
                                        background: 'rgba(0,0,0,0.7)',
                                        border: '2px solid #555',
                                        borderRadius: '8px',
                                        fontFamily: '"Press Start 2P"',
                                        fontSize: '0.65rem',
                                        lineHeight: '2'
                                    }}>
                                        <div style={{ color: 'yellow', marginBottom: '12px', textAlign: 'center', fontSize: '0.8rem', borderBottom: '1px solid #444', paddingBottom: '8px' }}>RANKING</div>
                                        {playerRanks.map((p) => (
                                            <div key={p.index} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px', color: p.index === playerIndex ? 'var(--text-cyan)' : 'white' }}>
                                                    {p.rank}.{p.name}
                                                </div>
                                                <div style={{ color: p.diffColor, textAlign: 'right', minWidth: '80px' }}>
                                                    {p.rank === 1 ? '+' : '-'}{!showTetrisGap ? Math.abs(p.diff).toLocaleString() : `${p.tetrisDiff}T`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    );
                })()}
            </div>
            {gameState === 'GAMEOVER' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 15000 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        {winner === 'TIE' && <div style={{ fontSize: '4rem', color: 'yellow' }}>TIE</div>}
                        <div style={{ fontSize: '3rem', color: (winner === 'WIN' || winner === 'P1_WIN' || winner === 'P2_WIN') ? '#0f0' : (winner === 'TIE' ? 'yellow' : 'red'), textShadow: '4px 4px #000', fontFamily: '"Press Start 2P"', textAlign: 'center' }}>
                            {winner === 'WIN' ? 'YOU WIN!' :
                                winner === 'LOSE' ? 'YOU LOSE!' :
                                    winner === 'P1_WIN' ? 'P1 WINS!' :
                                        winner === 'P2_WIN' ? 'P2 WINS!' :
                                            'TIE GAME'}
                        </div>
                        <div style={{ fontSize: '1.2rem', color: 'white', fontFamily: '"Press Start 2P"', marginTop: '20px' }}>
                            {(() => {
                                const finalResults = roomStats.player_name
                                    .map((name, idx) => ({ name, score: playersData[idx].current.score, idx }))
                                    .filter(p => p.name !== '')
                                    .sort((a, b) => b.score - a.score);
                                return finalResults.map((p, i) => {
                                    const rankText = i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}th`;
                                    return (
                                        <div key={p.idx} style={{ marginBottom: '15px', color: p.name === user.account ? 'var(--text-cyan)' : 'white' }}>
                                            {rankText}. {p.name} {formatScore(p.score)}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                        <div style={{ fontSize: '1.2rem', color: 'red', fontFamily: '"Press Start 2P"' }}>Returning in {gameOverCountdown}s...</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiPlayerGame;
