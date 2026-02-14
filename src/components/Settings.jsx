import React, { useState, useEffect, useRef } from 'react';

const Settings = ({ onBack }) => {
    const [settings, setSettings] = useState({
        Left: 'arrowleft',
        Right: 'arrowright',
        Down: 'arrowdown',
        Drop: 'space',
        'Rotate-Right': 'z',
        'Rotate-Left': 'x',
        show_preview: '1'
    });

    const [listeningKey, setListeningKey] = useState(null);
    const listeningKeyRef = useRef(null);

    useEffect(() => {
        listeningKeyRef.current = listeningKey;
    }, [listeningKey]);

    useEffect(() => {
        const saved = localStorage.getItem('tetris_settings');
        if (saved) {
            setSettings(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (listeningKey) {
                const keyName = e.key === ' ' ? 'space' : e.key;
                setSettings(prev => ({ ...prev, [listeningKey]: keyName.toLowerCase() }));
                setListeningKey(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [listeningKey]);

    // Gamepad Polling Effect
    useEffect(() => {
        let rafId;
        const AXIS_THRESHOLD = 0.5;

        const pollGamepad = () => {
            if (!listeningKeyRef.current) return;

            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            for (const gp of gamepads) {
                if (!gp) continue;

                // Check buttons
                for (let i = 0; i < gp.buttons.length; i++) {
                    if (gp.buttons[i].pressed) {
                        setSettings(prev => ({ ...prev, [listeningKeyRef.current]: `gp:button:${i}` }));
                        setListeningKey(null);
                        return;
                    }
                }

                // Check axes
                for (let i = 0; i < gp.axes.length; i++) {
                    const val = gp.axes[i];
                    if (Math.abs(val) > AXIS_THRESHOLD) {
                        const sign = val > 0 ? '+' : '-';
                        setSettings(prev => ({ ...prev, [listeningKeyRef.current]: `gp:axis:${i}:${sign}` }));
                        setListeningKey(null);
                        return;
                    }
                }
            }
            rafId = requestAnimationFrame(pollGamepad);
        };

        if (listeningKey) {
            rafId = requestAnimationFrame(pollGamepad);
        }

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [listeningKey]);

    const handleSave = () => {
        localStorage.setItem('tetris_settings', JSON.stringify(settings));
        onBack();
    };

    const keysToConfig = [
        { label: 'Left', key: 'Left' },
        { label: 'Right', key: 'Right' },
        { label: 'Down', key: 'Down' },
        { label: 'Hard Drop', key: 'Drop' },
        { label: 'Rotate Right', key: 'Rotate-Right' },
        { label: 'Rotate Left', key: 'Rotate-Left' }
    ];

    const formatKey = (key) => {
        if (!key) return '';
        if (key.startsWith('gp:button:')) {
            return `GP BUTTON ${key.split(':')[2]}`;
        }
        if (key.startsWith('gp:axis:')) {
            const parts = key.split(':');
            return `GP AXIS ${parts[2]}${parts[3]}`;
        }
        return key.toUpperCase();
    };

    return (
        <div className="settings-screen" style={{
            background: '#000',
            minHeight: '100vh',
            width: '100%',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px 20px',
            fontFamily: '"Press Start 2P"',
            overflowY: 'auto',
            boxSizing: 'border-box'
        }}>
            <h1 style={{ fontSize: '2.5rem', color: 'cyan', marginBottom: '100px', textAlign: 'center' }}>SETTINGS</h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px 30px',
                width: '100%',
                maxWidth: '700px',
                fontSize: '0.9rem'
            }}>
                {keysToConfig.map(item => (
                    <React.Fragment key={item.key}>
                        <div style={{ alignSelf: 'center' }}>{item.label}</div>
                        <div
                            onClick={() => setListeningKey(item.key)}
                            style={{
                                background: listeningKey === item.key ? '#555' : '#333',
                                border: '2px solid white',
                                padding: '12px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                color: listeningKey === item.key ? 'yellow' : 'white',
                                fontSize: '0.8rem',
                                minHeight: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {listeningKey === item.key ? 'WAITING...' : formatKey(settings[item.key])}
                        </div>
                    </React.Fragment>
                ))}

                <div style={{ alignSelf: 'center' }}>Preview</div>
                <select
                    value={settings.show_preview}
                    onChange={(e) => setSettings(prev => ({ ...prev, show_preview: e.target.value }))}
                    style={{
                        background: '#333',
                        color: 'white',
                        border: '2px solid white',
                        padding: '12px',
                        fontFamily: '"Press Start 2P"',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                    }}
                >
                    <option value="1">ON</option>
                    <option value="0">OFF</option>
                </select>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginTop: '80px', marginBottom: '20px' }}>
                <button
                    onClick={handleSave}
                    style={{ background: 'none', border: '2px solid cyan', color: 'cyan', padding: '12px 24px', cursor: 'pointer', fontSize: '1rem', fontFamily: '"Press Start 2P"' }}
                >
                    SAVE & QUIT
                </button>
                <button
                    onClick={onBack}
                    style={{ background: 'none', border: '2px solid red', color: 'red', padding: '12px 24px', cursor: 'pointer', fontSize: '1rem', fontFamily: '"Press Start 2P"' }}
                >
                    BACK
                </button>
            </div>
        </div>
    );
};

export default Settings;
