import React, { useState, useEffect, useContext } from 'react';
import { Socket } from 'socket.io-client';
import { GameState } from '../types/game';
import { GameContext } from '../pages/_app';
import styles from '../styles/Game.module.css';
import Board from './board';

interface Props {
  socket: Socket;
  gameId: string;
}

const Game = ({ socket, gameId }: Props) => {
  const { playerName } = useContext(GameContext);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket || !gameId) return;

    console.log('Setting up game with ID:', gameId);

    // Set up event listeners
    socket.on('gameState', (state: GameState) => {
      console.log('Received game state update:', state);
      setGameState(state);
    });

    // Join the game
    console.log('Joining game with name:', playerName);
    socket.emit('joinGame', { gameId, playerName }, (response: GameState | null) => {
      console.log('Join game response:', response);
      if (response) {
        setGameState(response);
      } else {
        setError('Failed to join game. The game may not exist.');
      }
    });

    // Cleanup
    return () => {
      socket.off('gameState');
    };
  }, [socket, gameId, playerName]);

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading game...</p>
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
              {player.name} {player.isHost && '(Host)'} {player.id === socket.id && '(You)'}
            </div>
          ))}
        </div>
      </div>
      <Board
        gameState={gameState}
        setGameState={setGameState}
        socket={socket}
        gameId={gameId}
      />
    </div>
  );
};

export default Game;
