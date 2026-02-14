import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
            transports: ['websocket'],
            autoConnect: true
        });
        setSocket(newSocket);

        return () => {
            if (newSocket) newSocket.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
