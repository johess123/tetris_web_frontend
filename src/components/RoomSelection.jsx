import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

const RoomSelection = ({ user, onJoin, onLogout, onSettings }) => {
    const socket = useSocket();
    const [stats, setStats] = useState({ best: '0', win: '0', lose: '0', tie: '0' });
    const [leaderboard, setLeaderboard] = useState([]);
    const [rooms, setRooms] = useState(Array(10).fill(false)); // true if locked

    useEffect(() => {
        fetchStats();
        if (socket) {
            socket.on('lock_room', (data) => {
                if (data && data.lock_room_list) {
                    setRooms(data.lock_room_list);
                }
            });
        }
        return () => {
            if (socket) {
                socket.off('lock_room');
            }
        };
    }, [socket]);

    const fetchStats = async () => {
        const formData = new FormData();
        formData.append('account', user.account);
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const res = await fetch(`${baseUrl}/get_score`, { method: 'POST', body: formData });
        const data = await res.json();
        const parts = data.return_text.split(',');
        setStats({ best: parts[0], win: parts[1], lose: parts[2], tie: parts[3] });

        // Parse leaderboard from parts[4:]
        const leaderEntries = parts.slice(4).filter(e => e.trim()).map(e => {
            const spaceIdx = e.lastIndexOf(' ');
            return {
                name: e.substring(0, spaceIdx),
                score: e.substring(spaceIdx + 1)
            };
        });
        setLeaderboard(leaderEntries);
    };

    const getRankIcon = (name, score, leader) => {
        const acc = (name || '').trim();
        const best = parseInt(score) || 0;

        const rankIdx = leader.findIndex(p => p.name.trim() === acc);
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

    return (
        <section className="room-screen">
            <header className="room-header">
                <div className="leader-panel">
                    <div className="leader-title">Leader Board</div>
                    <div className="leader-headers">
                        <span style={{ color: 'red', width: '130px' }}>Rank</span>
                        <span style={{ color: 'cyan', width: '220px' }}>Name</span>
                        <span style={{ color: 'yellow', width: '100px' }}>Score</span>
                    </div>
                    <div className="leader-list">
                        {leaderboard.map((player, i) => (
                            <div key={i} className="leader-item">
                                <span style={{ width: '130px' }}><img src={`/img_multi/${i + 1}.png`} alt={i + 1} style={{ height: '50px' }} /></span>
                                <span style={{ width: '220px', fontSize: '1.2rem' }}>{player.name}</span>
                                <span style={{ width: '100px', fontSize: '1.2rem' }}>{player.score}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="player-panel">
                    <div className="version-text">v1.0</div>
                    <div>Player Name</div>
                    <div className="player-name-val">{user.account}</div>
                    <div style={{ marginTop: '2rem' }}>Rank</div>
                    <div style={{ marginTop: '1rem' }}>
                        <img src={getRankIcon(user.account, stats.best, leaderboard)} alt="rank" style={{ width: '50px' }} />
                    </div>
                </div>
            </header>

            <main className="room-main">
                <h2 className="choose-room-title">Choose Room Num</h2>
                <div className="room-grid">
                    {rooms.map((isLocked, i) => (
                        <div
                            key={i}
                            className="room-num"
                            onClick={() => !isLocked && onJoin({ roomNum: i, stats, leaderboard })}
                            style={{ color: isLocked ? '#555' : 'white' }}
                        >
                            {i}
                        </div>
                    ))}
                </div>
            </main>

            <footer className="room-footer">
                <button className="footer-btn-settings" onClick={onSettings}>Settings</button>
                <button className="footer-btn-single" onClick={() => onJoin({ roomNum: -1, stats, leaderboard })}>Single Mode</button>
                <button className="footer-btn-logout" onClick={onLogout}>Logout</button>
            </footer>
        </section>
    );
};

export default RoomSelection;
