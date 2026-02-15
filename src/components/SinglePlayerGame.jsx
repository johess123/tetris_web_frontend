import React, { useEffect, useRef, useState, useCallback } from 'react';

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
const BG_IMAGES_COUNT = 1;

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
    count: '/audio/count.mp3',
    select: '/audio/select.mp3'
};

const formatScore = (score) => {
    const s = parseInt(score) || 0;
    if (s < 1000000) return String(s).padStart(6, '0');
    const letterIdx = Math.floor((s - 1000000) / 100000);
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    if (letterIdx >= 0 && letterIdx < letters.length) {
        const remainder = s % 100000;
        return letters[letterIdx] + String(remainder).padStart(5, '0');
    }
    return String(s);
};

const SinglePlayerGame = ({ user, roomData, onBack }) => {
    const gameScreenRef = useRef(null);
    const canvasRef = useRef(null);
    const nextCanvasRef = useRef(null);

    const [gameState, setGameState] = useState('COUNTING');
    const [preGameCount, setPreGameCount] = useState(3);
    const [gameOverCountdown, setGameOverCountdown] = useState(10);

    const gameRef = useRef({
        pos: { x: 5, y: 0 },
        blockType: undefined,
        rotationIndex: 0,
        nextBlockType: undefined,
        seeds: Array.from({ length: 1000 }, () => Math.floor(Math.random() * 1000)),
        seedIndex: 0,
        dropCounter: 0,
        grid: Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0)),
        score: 0,
        lines: 0,
        tetrisLines: 0,
        level: roomData.level || 0,
        startLevel: roomData.level || 0,
        bgCount: 0,
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
        clickIntervals: [],
        downCounter: 0
    });

    const audioRefs = useRef({});
    const whiteImages = useRef([]);
    const grayFlashImages = useRef([]);
    const grayBg = useRef(null);
    const loseImg = useRef(null);

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
        if (audio) {
            audio.currentTime = 0;
            // Preload to reduce delay
            audio.play().catch(e => console.error("Audio play failed:", e));
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
        const levelIdx = level % 10;
        const baseColor = COLOR_PALETTES[colorIdx][levelIdx];
        const secondaryColor = COLOR_PALETTES[3][levelIdx];
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
        } else if (!(levelIdx === 9 && (colorIdx === 2 || colorIdx === 4))) {
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

    const draw = useCallback(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        const g = gameRef.current;
        const settings = JSON.parse(localStorage.getItem('tetris_settings') || '{}');

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

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'; ctx.lineWidth = 1;
        for (let i = 0; i <= GRID_WIDTH; i++) { ctx.beginPath(); ctx.moveTo(i * BLOCK_SIZE, 0); ctx.lineTo(i * BLOCK_SIZE, GRID_HEIGHT * BLOCK_SIZE); ctx.stroke(); }
        for (let i = 0; i <= GRID_HEIGHT; i++) { ctx.beginPath(); ctx.moveTo(0, i * BLOCK_SIZE); ctx.lineTo(GRID_WIDTH * BLOCK_SIZE, i * BLOCK_SIZE); ctx.stroke(); }

        drawGrid(ctx, g.grid, g.level, g.clearingLines, g.clearingPhase, g.flashActive, g.flashFrameCounter);

        if (!g.flashActive && g.clearingPhase === -1 && g.blockType !== undefined && g.startWait <= 0 && !g.gameOverSoundTriggered) {
            const coords = BLOCKS_ROTATIONS[g.blockType].rotations[g.rotationIndex];
            if (settings.show_preview !== '0') {
                let ghostY = g.pos.y; while (!collide(coords, { x: g.pos.x, y: ghostY + 1 }, g.grid)) ghostY++;
                coords.forEach(c => drawCell(ctx, c[0] + g.pos.x, c[1] + ghostY, g.blockType + 1, g.level, BLOCK_SIZE, true));
            }
            coords.forEach(c => drawCell(ctx, c[0] + g.pos.x, c[1] + g.pos.y, g.blockType + 1, g.level));
        }
    }, [drawCell, collide]);

    const drawNext = useCallback((ctxRef, typeIdx, level, size = 25) => {
        if (!ctxRef.current) return;
        const ctx = ctxRef.current.getContext('2d');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        if (typeIdx !== undefined) {
            const rotations = BLOCKS_ROTATIONS[typeIdx].rotations[0];
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
        g.downCounter = 0; g.dropCounter = 0;
        if (collide(BLOCKS_ROTATIONS[g.blockType].rotations[g.rotationIndex], g.pos, g.grid)) {
            if (audioRefs.current.bgm) audioRefs.current.bgm.pause();
            if (!g.gameOverSoundTriggered) {
                g.gameOverSoundTriggered = true;
                playSound('topout'); playSound('lose'); playSound('ed');
                setGameState('GAMEOVER');
                saveScore(g.score);
            }
            return;
        }
        drawNext(nextCanvasRef, g.nextBlockType, g.level, 25);
        setUiStats(prev => ({ ...prev, drt: g.drt, trt: Math.round((g.tetrisLines / (g.lines || 1)) * 100) }));
    }, [drawNext, collide]);

    const saveScore = async (score) => {
        const formData = new FormData();
        formData.append('account', user.account);
        formData.append('score', score);
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            await fetch(`${baseUrl}/save_score`, { method: 'POST', body: formData });
        } catch (e) {
            console.error("Save score error:", e);
        }
    };

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
                if (g.level > prevLvl) playSound('levelup');
            }
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
        for (let i = 1; i <= 12; i++) { const img = new Image(); const ext = [12, 3, 4, 6, 8].includes(i) ? 'png' : 'jpg'; img.src = `/img_multi/white${i}.${ext}`; whiteImages.current.push(img); }
        const g1 = new Image(); g1.src = '/img_multi/gray1.png'; const g2 = new Image(); g2.src = '/img_multi/gray2.jpg';
        grayFlashImages.current = [g1, g2]; grayBg.current = new Image(); grayBg.current.src = '/img_multi/gray.jpg';
        loseImg.current = new Image(); loseImg.current.src = '/img_multi/lose.png';



        return () => {
            Object.values(audioRefs.current).forEach(audio => {
                if (Array.isArray(audio)) audio.forEach(a => { a.pause(); a.currentTime = 0; });
                else { audio.pause(); audio.currentTime = 0; }
            });
        };
    }, []);

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
                        // For Left/Right, DAS logic will handle it since g.keysDown[binding] will be true
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
                    if (g.bgCount % 10 === 0) {
                        const now = performance.now(); g.clickIntervals = g.clickIntervals.filter(t => now - t < 1000);
                        g.hz = g.clickIntervals.length.toFixed(2);
                        setUiStats(prev => ({ ...prev, hz: g.hz }));
                    }
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
                            if (g.keysDown[downKey] && g.startPreDropWait <= 0 && g.startWait <= 0) {
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
                    accumulator -= tickRate;
                }
            }
            draw(); animationFrameId = requestAnimationFrame(animate);
        };
        animationFrameId = requestAnimationFrame(animate); return () => { cancelAnimationFrame(animationFrameId); };
    }, [gameState]);

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
        const handleKeyDown = (e) => {
            const g = gameRef.current; const k = (e.key === ' ' ? 'space' : e.key).toLowerCase(); g.keysDown[k] = true;
            if (gameState !== 'PLAYING' || g.clearingPhase >= 0 || g.flashActive || g.blockType === undefined) return;
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
        const handleKeyUp = (e) => { gameRef.current.keysDown[(e.key === ' ' ? 'space' : e.key).toLowerCase()] = false; };
        window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, [gameState]);

    useEffect(() => {
        let timer;
        if (gameState === 'COUNTING') {
            // Play countdown sound ONLY ONCE at the start
            playSound('count');

            setPreGameCount(3);
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
    }, [gameState]);

    useEffect(() => {
        let timer; if (gameState === 'GAMEOVER') { timer = setInterval(() => { setGameOverCountdown(prev => { if (prev <= 1) { clearInterval(timer); onBack(); return 0; } return prev - 1; }); }, 1000); }
        return () => clearInterval(timer);
    }, [gameState, onBack]);

    return (
        <div className="game-screen" ref={gameScreenRef} style={{ backgroundImage: 'url(/img_multi/bg1.jpg)', backgroundSize: 'cover' }}>
            {gameState === 'COUNTING' && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: '#000', // Solid black until countdown ends
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

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '80px', position: 'relative', zIndex: 1, padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                    <div className="left-stats" style={{ width: '100px', display: 'flex', flexDirection: 'column', gap: '40px', fontFamily: '"Press Start 2P"', color: 'white' }}>
                        <div className="stat-group"><div style={{ fontSize: '1rem', marginBottom: '10px' }}>DRT</div><div style={{ fontSize: '1.4rem', color: uiStats.drt > 12 ? 'red' : 'white' }}>{String(uiStats.drt).padStart(3, '0')}</div></div>
                        <div className="stat-group"><div style={{ fontSize: '1rem', marginBottom: '10px' }}>TRT</div><div style={{ fontSize: '1.4rem' }}>{uiStats.trt}%</div></div>
                        <div className="stat-group"><div style={{ fontSize: '1rem', marginBottom: '10px' }}>BRN</div><div style={{ fontSize: '1.4rem' }}>{String(uiStats.brn).padStart(3, '0')}</div></div>
                    </div>
                    <div className="board-center" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '15px' }}>
                            <div style={{ color: 'white', fontFamily: '"Press Start 2P"', fontSize: '1.5rem' }}>{user.account}</div>
                        </div>
                        <div className="canvas-container" style={{ border: '4px solid #777', background: '#000' }}><canvas ref={canvasRef} width={BLOCK_SIZE * GRID_WIDTH} height={BLOCK_SIZE * GRID_HEIGHT} /></div>
                    </div>
                    <div className="right-stats" style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '30px', fontFamily: '"Press Start 2P"', color: 'white' }}>
                        <div className="stat-group"><div style={{ fontSize: '1rem', marginBottom: '10px' }}>SCORE</div><div style={{ fontSize: '1.4rem' }}>{formatScore(uiStats.score)}</div></div>
                        <div className="stat-group"><div style={{ fontSize: '1rem', marginBottom: '10px' }}>LINES</div><div style={{ fontSize: '1.4rem' }}>{String(uiStats.lines).padStart(3, '0')}</div></div>
                        <div className="stat-group">
                            <div style={{ fontSize: '1rem', marginBottom: '10px' }}>NEXT</div>
                            <div style={{ height: '90px', width: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><canvas ref={nextCanvasRef} width="120" height="90" /></div>
                        </div>
                        <div className="stat-group"><div style={{ fontSize: '1rem', marginBottom: '10px' }}>LEVEL</div><div style={{ fontSize: '1.4rem' }}>{String(uiStats.level).padStart(2, '0')}</div></div>
                        <div style={{ fontSize: '1rem', color: 'white', marginTop: '10px' }}>{uiStats.hz} HZ</div>
                    </div>
                </div>
            </div>

            {gameState === 'GAMEOVER' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 15000 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        <img src="/img_multi/lose.png" alt="lose" style={{ width: '280px' }} />
                        <div style={{ fontSize: '3rem', color: 'yellow', textShadow: '4px 4px #000', fontFamily: '"Press Start 2P"' }}>Game Over!</div>
                        <div style={{ fontSize: '1.2rem', color: 'red', fontFamily: '"Press Start 2P"' }}>Returning in {gameOverCountdown}s...</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SinglePlayerGame;
