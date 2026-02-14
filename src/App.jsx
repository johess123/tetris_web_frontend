import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import RoomSelection from './components/RoomSelection';
import MultiPlayerGame from './components/MultiPlayerGame';
import SinglePlayerGame from './components/SinglePlayerGame';
import SingleModeLevel from './components/SingleModeLevel';
import Settings from './components/Settings';
import { SocketProvider } from './context/SocketContext';

function App() {
    const [user, setUser] = useState(null);
    const [screen, setScreen] = useState('login'); // login, room, single-level, game
    const [roomData, setRoomData] = useState(null);

    useEffect(() => {
        if (screen === 'game') {
            document.body.classList.add('in-game');
        } else {
            document.body.classList.remove('in-game');
        }
    }, [screen]);

    const handleLogin = (userData) => {
        setUser(userData);
        setScreen('room');
    };

    const handleJoinRoom = (data) => {
        setRoomData(data);
        if (data.roomNum === -1) {
            setScreen('single-level');
        } else {
            setScreen('game');
        }
    };

    const handleStartSingle = (level) => {
        setRoomData(prev => ({ ...prev, level }));
        setScreen('game');
    };

    return (
        <SocketProvider>
            <div className="app-container">
                {screen === 'login' && <Login onLogin={handleLogin} />}
                {screen === 'room' && <RoomSelection user={user} onJoin={handleJoinRoom} onLogout={() => setScreen('login')} onSettings={() => setScreen('settings')} />}
                {screen === 'single-level' && <SingleModeLevel user={user} stats={roomData.stats} leaderboard={roomData.leaderboard} onSelect={handleStartSingle} onBack={() => setScreen('room')} />}
                {screen === 'settings' && <Settings onBack={() => setScreen('room')} />}
                {screen === 'game' && roomData.roomNum === -1 && <SinglePlayerGame
                    user={user}
                    roomData={roomData}
                    onBack={() => setScreen('single-level')}
                />}
                {screen === 'game' && roomData.roomNum !== -1 && <MultiPlayerGame
                    user={user}
                    roomData={roomData}
                    onBack={() => setScreen('room')}
                />}
            </div>
        </SocketProvider>
    );
}

export default App;
