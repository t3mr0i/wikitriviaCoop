import React, { useState, useEffect } from "react";
import { polyfill } from "seamless-scroll-polyfill";
import Head from 'next/head';
import "../styles/globals.css";
import { io } from 'socket.io-client';
import type { AppProps } from 'next/app';
import { Socket } from 'socket.io-client';

// Create a context for the socket and player name
export const GameContext = React.createContext<{
  socket: Socket | null;
  playerName: string;
  setPlayerName: (name: string) => void;
}>({
  socket: null,
  playerName: '',
  setPlayerName: () => {},
});

function App({ Component, pageProps }: AppProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    polyfill();
    
    // Only create socket if we don't have one
    if (!socket) {
      const newSocket = io('http://localhost:3003', {
        path: '/api/socketio',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      setSocket(newSocket);
    }

    // Cleanup function
    return () => {
      // Don't disconnect the socket on component unmount
      // We want to keep it alive across page changes
    };
  }, [socket]);

  return (
    <GameContext.Provider value={{ socket, playerName, setPlayerName }}>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Component {...pageProps} />
    </GameContext.Provider>
  );
}

export default App;
