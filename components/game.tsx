import React, { useState, useEffect, useContext } from 'react';
import { Socket } from 'socket.io-client';
import axios from 'axios';
import { GameState } from '../types/game';
import { Item } from '../types/item';
import { GameContext } from '../pages/_app';
import styles from '../styles/Game.module.css';
import Board from './board';
import Loading from './loading';
import Instructions from './instructions';
import badCards from '../lib/bad-cards';

interface Props {
  socket: Socket;
  gameId: string;
}

const Game = ({ socket, gameId }: Props) => {
  const { playerName } = useContext(GameContext);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [started, setStarted] = useState(false);

  // Fetch items from Wikimedia
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const res = await axios.get<Item[]>("/items.json");
        const items = res.data
          .filter((item) => !item.label.includes(String(item.year)))
          .filter((item) => !item.description.includes(String(item.year)))
          .filter((item) => !/(?:th|st|nd)[ -]century/i.test(item.description))
          // Filter cards which have bad data
          .filter((item) => !(item.id in badCards));
        setItems(items);
      } catch (err) {
        console.error('Error fetching items:', err);
        setError('Failed to load game items');
      }
    };

    fetchGameData();
  }, []);

  useEffect(() => {
    if (!socket || !gameId) return;

    // Set up event listeners
    socket.on('gameState', (state: GameState) => {
      console.log('Received game state:', {
        hasNext: !!state.next,
        nextId: state.next?.id,
        playedCount: state.played?.length,
        deckSize: state.deck?.length,
        category: state.category
      });
      setGameState(state);
      // Auto-start when we receive a valid game state
      if (state.next && !started) {
        setStarted(true);
      }
    });

    // Join the game
    console.log('Joining game with name:', playerName);
    socket.emit('joinGame', { gameId, playerName }, (response: GameState | null) => {
      if (response) {
        console.log('Join game response:', {
          hasNext: !!response.next,
          nextId: response.next?.id,
          playedCount: response.played?.length,
          deckSize: response.deck?.length,
          category: response.category
        });
        setGameState(response);
        // Auto-start when we receive a valid game state
        if (response.next) {
          setStarted(true);
        }
      } else {
        setError('Failed to join game. The game may not exist.');
      }
    });

    // Request initial game state
    socket.emit('requestGameState', { gameId });

    return () => {
      socket.off('gameState');
    };
  }, [socket, gameId, playerName]);

  // Add debug logging for render conditions
  console.log('Render state:', {
    error,
    hasItems: !!items,
    itemsCount: items?.length,
    hasGameState: !!gameState,
    started,
    hasNext: !!gameState?.next,
    hasPlayed: gameState?.played?.length,
    hasDeck: gameState?.deck?.length
  });

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }

  if (!items || !gameState) {
    console.log('Loading state - items:', !!items, 'gameState:', !!gameState);
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading game...</p>
      </div>
    );
  }

  if (!started) {
    console.log('Showing instructions - gameState:', {
      hasNext: !!gameState.next,
      nextId: gameState.next?.id,
      playedCount: gameState.played?.length,
      deckSize: gameState.deck?.length
    });
    return (
      <Instructions start={() => {
        console.log('Starting game...');
        // Request a new game state when starting
        socket.emit('startGame', gameId);
        setStarted(true);
      }} />
    );
  }

  console.log('Rendering game board with:', {
    hasNext: !!gameState.next,
    nextId: gameState.next?.id,
    playedCount: gameState.played?.length,
    deckSize: gameState.deck?.length
  });

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
        items={items}
      />
    </div>
  );
};

export default Game;
