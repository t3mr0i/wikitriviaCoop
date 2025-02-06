import React, { useState, useEffect, useContext } from 'react';
import { Socket } from 'socket.io-client';
import { GameState } from '../types/game';
import { GameContext } from '../pages/_app';
import styles from '../styles/Game.module.css';

interface Props {
  socket: Socket;
  gameId: string;
}

const Game = ({ socket, gameId }: Props) => {
  const { playerName } = useContext(GameContext);
  const [loaded, setLoaded] = useState(false);
  const [connected, setConnected] = useState(socket.connected);
  const [hasGameState, setHasGameState] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Debug state
  useEffect(() => {
    console.log('State Debug:', {
      loaded,
      connected,
      hasGameState,
      gameState,
      error,
      isJoining
    });
  }, [loaded, connected, hasGameState, gameState, error, isJoining]);

  useEffect(() => {
    if (!socket || !gameId) return;

    console.log('Setting up socket with gameId:', gameId, 'socket id:', socket.id);

    // Set up event listeners
    const setupSocketListeners = () => {
      socket.on('connect', () => {
        console.log('Socket connected in game');
        setConnected(true);
        // Re-join game if we were disconnected
        if (!hasGameState && !isJoining) {
          joinGame();
        }
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected in game');
        setConnected(false);
      });

      socket.on('gameState', (state: GameState) => {
        console.log('Received game state:', state);
        setGameState(state);
        setHasGameState(true);
        setLoaded(true);
      });
    };

    const joinGame = () => {
      console.log('Joining game with ID:', gameId);
      setIsJoining(true);
      socket.emit('joinGame', { gameId, playerName }, (response: GameState | null) => {
        console.log('Join game response:', response);
        if (response) {
          setGameState(response);
          setHasGameState(true);
          setLoaded(true);
        } else {
          setError('Failed to join game. The game may not exist.');
        }
        setIsJoining(false);
      });
    };

    // If socket is already connected, we can start setting up events
    if (socket.connected) {
      console.log('Socket already connected, setting up events');
      setupSocketListeners();
      if (!hasGameState && !isJoining) {
        joinGame();
      }
    }

    // Cleanup function
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('gameState');
    };
  }, [socket, gameId, playerName, hasGameState, isJoining]);

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }

  if (!loaded || !gameState) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading game{!connected ? ' (Connecting to server...)' : '...'}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.gameInfo}>
        <h2>Game #{gameId}</h2>
        <div className={styles.players}>
          <h3>Players:</h3>
          {gameState.players.map((player) => (
            <div key={player.id} className={styles.player}>
              {player.name} {player.id === socket.id && '(You)'}
            </div>
          ))}
        </div>
      </div>
      {/* Add your game UI components here */}
    </div>
  );
};

export default Game;
