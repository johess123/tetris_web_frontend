import React, { useState } from 'react';

const SingleModeLevel = ({ user, stats, leaderboard, onSelect, onBack }) => {
    const [titleColor, setTitleColor] = useState('cyan');
    const colors = ['red', 'cyan', 'yellow'];

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

    React.useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            i = (i + 1) % colors.length;
            setTitleColor(colors[i]);
        }, 300); // 0.3s interval

        const selectAudio = new Audio('/audio/select.mp3');
        selectAudio.loop = true;
        selectAudio.play().catch(e => console.error("Select audio play failed:", e));

        return () => {
            clearInterval(timer);
            selectAudio.pause();
            selectAudio.currentTime = 0;
        };
    }, []);

    return (
        <div className="single-room-screen" style={{ background: '#000', height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', color: 'white' }}>
            <h1 style={{ fontSize: '4rem', color: titleColor, marginTop: '20px', fontFamily: '"Press Start 2P"', transition: 'color 0.1s ease' }}>TETRIS</h1>
            <h2 style={{ fontSize: '2.5rem', marginTop: '40px', marginBottom: '20px' }}>LEVEL</h2>

            <div style={{ position: 'absolute', top: '100px', right: '50px', color: 'red', fontSize: '1.2rem' }}>Room ID : Single Mode</div>

            <div style={{ display: 'flex', width: '100%', padding: '0 100px', justifyContent: 'space-between', marginTop: '40px' }}>
                {/* Left Stats Panel */}
                <div style={{ textAlign: 'left', width: '300px' }}>
                    <div style={{ color: 'yellow', fontSize: '1.2rem', marginBottom: '1rem' }}>Player1</div>
                    <div style={{ marginBottom: '2rem' }}>{user.account}</div>

                    <div style={{ color: 'cyan', fontSize: '1rem', marginBottom: '0.5rem' }}>Best Score</div>
                    <div style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>{String(stats.best).padStart(6, '0')}</div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'red' }}>Win</span>
                        <span style={{ color: 'cyan' }}>Lose</span>
                        <span style={{ color: 'yellow' }}>Tie</span>
                    </div>
                    <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '2rem' }}>
                        <span>{stats.win}</span>
                        <span>{stats.lose}</span>
                        <span>{stats.tie}</span>
                    </div>

                    <div style={{ color: 'red', fontSize: '1rem', marginBottom: '1rem' }}>Rank</div>
                    <div>
                        <img src={getRankIcon(user.account, stats.best, leaderboard)} alt="rank" style={{ width: '60px' }} />
                    </div>
                </div>

                {/* Level Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 80px)', gap: '40px', marginTop: '20px', alignContent: 'start' }}>
                    {[" 0", " 1", " 2", " 3", " 4", " 5", " 6", " 7", " 8", " 9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "", "", "29"].map((lv, i) => (
                        <div
                            key={i}
                            onClick={() => lv.trim() !== "" && onSelect(parseInt(lv.trim()))}
                            style={{ fontSize: '2rem', cursor: lv.trim() !== "" ? 'pointer' : 'default', textAlign: 'center' }}
                        >
                            {lv}
                        </div>
                    ))}
                </div>

                {/* Placeholder for symmetry or extra info if needed */}
                <div style={{ width: '300px' }}></div>
            </div>

            <div style={{ position: 'absolute', bottom: '50px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '100px' }}>
                <div onClick={onBack} style={{ fontSize: '1.5rem', cursor: 'pointer' }}>back</div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <span style={{ color: 'yellow' }}>Play Mode : </span>
                    <span style={{ color: 'yellow' }}>Player1</span>
                </div>
            </div>
        </div>
    );
};

export default SingleModeLevel;
