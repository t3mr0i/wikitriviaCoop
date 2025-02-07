import React, { useLayoutEffect, useMemo, useState, useEffect } from "react";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { GameState } from "../types/game";
import useAutoMoveSensor from "../lib/useAutoMoveSensor";
import { checkCorrect, getRandomItem, preloadImage } from "../lib/items";
import NextItemList from "./next-item-list";
import PlayedItemList from "./played-item-list";
import styles from "../styles/board.module.scss";
import Hearts from './hearts';
import GameOver from './game-over';
import io from 'socket.io-client';
import Moves from './moves';
import { Item } from '../types/item';
import { Player } from '../types/game';
import Ranking from './ranking';
import { Socket } from 'socket.io-client';

interface Props {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  socket: Socket;
  gameId: string;
  items: Item[];
}

interface PlayerInfoProps {
  player: Player;
  isCurrentUser: boolean;
  setReady: (ready: boolean) => void;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ player, isCurrentUser, setReady }) => {
  return (
    <div>
      <span>{player.name}</span>
      <Hearts lives={player.lives} />
      <span>Ready: {player.ready ? 'Yes' : 'No'}</span>
      {isCurrentUser && (
        <button onClick={() => setReady(!player.ready)}>
          {player.ready ? 'Unready' : 'Ready'}
        </button>
      )}
    </div>
  );
};

const Board: React.FC<Props> = ({ gameState, setGameState, socket, gameId, items }) => {
  const [state, setState] = useState(gameState);
  const [isDragging, setIsDragging] = useState(false);

  // Keep local state in sync with props
  useEffect(() => {
    setState(gameState);
  }, [gameState]);

  console.log('Board render state:', {
    hasNext: !!state.next,
    nextId: state.next?.id,
    playedCount: state.played?.length,
    deckSize: state.deck?.length,
    isDragging
  });

  async function onDragStart() {
    setIsDragging(true);
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(20);
    }
  }

  async function onDragEnd(result: DropResult) {
    setIsDragging(false);
    console.log('Drag end:', result);

    const { source, destination } = result;

    if (!destination || !state.next || (source.droppableId === "next" && destination.droppableId === "next")) {
      return;
    }

    const playerId = socket.id;
    if (!playerId) {
      console.error("Player ID is not available");
      return;
    }

    const item = { ...state.next };
    console.log('Moving item:', item);

    if (source.droppableId === "next" && destination.droppableId === "played") {
      console.log('Moving from next to played');
      const newDeck = [...state.deck];
      const newPlayed = [...state.played];
      const { correct, delta } = checkCorrect(newPlayed, item, destination.index);
      
      console.log('Move check:', { correct, delta });
      
      newPlayed.splice(destination.index, 0, {
        ...state.next,
        played: { correct },
        moves: [{ playerId, timestamp: Date.now() }],
      });

      const newNext = state.nextButOne;
      const newNextButOne = getRandomItem(newDeck, newNext ? [...newPlayed, newNext] : newPlayed);
      
      console.log('New cards:', { 
        newNext: newNext?.id, 
        newNextButOne: newNextButOne?.id 
      });

      // Find the player who made the move
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        // Update the player's lives
        const updatedPlayers = [...state.players];
        updatedPlayers[playerIndex] = {
          ...updatedPlayers[playerIndex],
          lives: correct ? updatedPlayers[playerIndex].lives : updatedPlayers[playerIndex].lives - 1,
        };

        const gameStateUpdate = {
          ...state,
          deck: newDeck,
          next: newNext,
          nextButOne: newNextButOne,
          played: newPlayed,
          players: updatedPlayers,
          badlyPlaced: correct ? null : {
            index: destination.index,
            rendered: false,
            delta,
          },
        } as GameState;

        console.log('Updating game state:', {
          deckSize: newDeck.length,
          hasNext: !!newNext,
          nextId: newNext?.id,
          playedCount: newPlayed.length
        });

        setState(gameStateUpdate);
        socket.emit('gameStateUpdate', {
          gameId,
          state: gameStateUpdate
        });
      }
    } else if (source.droppableId === "played" && destination.droppableId === "played") {
      console.log('Reordering played cards');
      const newPlayed = [...state.played];
      const [movedItem] = newPlayed.splice(source.index, 1);

      movedItem.moves = [
        ...(movedItem.moves || []),
        { playerId, timestamp: Date.now() },
      ];
      newPlayed.splice(destination.index, 0, movedItem);

      const gameStateUpdate = {
        ...state,
        played: newPlayed,
        badlyPlaced: null,
      } as GameState;

      setState(gameStateUpdate);
      socket.emit('gameStateUpdate', {
        gameId,
        state: gameStateUpdate
      });
    }
  }

  // Ensure that newly placed items are rendered as draggables before trying to
  // move them to the right place if needed.
  useLayoutEffect(() => {
    if (state.badlyPlaced) {
      setState((prevState: GameState) => ({
        ...prevState,
        badlyPlaced: state.badlyPlaced === null ? null : { ...state.badlyPlaced },
      }));
    }
  }, [state.badlyPlaced, setState]);

  const score = useMemo(() => {
    return state.played.filter((item) => item.played.correct).length - 1;
  }, [state.played]);

  return (
    <DragDropContext
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      sensors={[useAutoMoveSensor.bind(null, state)]}
    >
      <div className={styles.wrapper}>
        <div className={styles.top}>
          {state.players.map((player) => (
            <PlayerInfo
              key={player.id}
              player={player}
              isCurrentUser={player.id === socket.id}
              setReady={(ready) => {
                socket.emit('setReady', ready);
              }}
            />
          ))}
          {state.next && (
            <div className={styles.nextCard}>
              <NextItemList 
                next={state.next} 
                onClick={() => socket.emit('placeCard')}
              />
            </div>
          )}
          {state.gameType === 'versus' && (
            <Ranking 
              players={state.players} 
              currentPlayerId={socket.id || ''} 
            />
          )}
        </div>
        <div id="bottom" className={styles.bottom}>
          <PlayedItemList
            badlyPlacedIndex={
              state.badlyPlaced === null ? null : state.badlyPlaced.index
            }
            isDragging={isDragging}
            items={state.played}
          />
          <Moves moves={state.played.flatMap((item) => item.moves || [])} />
        </div>
      </div>
    </DragDropContext>
  );
}

export default Board;
