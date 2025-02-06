import React, { useState, useEffect } from "react";
import { polyfill } from "seamless-scroll-polyfill";
import Head from 'next/head';
import "../styles/globals.css";

import { io } from 'socket.io-client';
import type { AppProps } from 'next/app';
import { Socket } from 'socket.io-client';

function App({ Component, pageProps }: AppProps) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    polyfill();
    const newSocket = io('http://localhost:3003', {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Component {...pageProps} socket={socket} />
    </>
  );
}

export default App;
