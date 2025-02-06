import React, { useLayoutEffect, useMemo, useState } from "react";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { GameState } from "../types/game";
import useAutoMoveSensor from "../lib/useAutoMoveSensor";
import { checkCorrect, getRandomItem, preloadImage } from "../lib/items";
import NextItemList from "./next-item-list";
import PlayedItemList from "./played-item-list";
import styles from "../styles/board.module.scss";
import Hearts from "./hearts";
import GameOver from "./game-over";
import io from "socket.io-client";
import Moves from "./moves";
import { Item } from "../types/item";

interface Props {
  highscore: number;
  resetGame: () => void;
  state: GameState;
  setState: (state: GameState) => void;
  updateHighscore: (score: number) => void;
  socket: ReturnType<typeof io>;
}

export default function Board(props: Props) {
  const { highscore, resetGame, state, setState, updateHighscore, socket } = props;

  const [isDragging, setIsDragging] = useState(false);

  async function onDragStart() {
    setIsDragging(true);
    navigator.vibrate(20);
  }

  async function onDragEnd(result: DropResult) {
    setIsDragging(false);

    const { source, destination } = result;

    if (
      !destination ||
      state.next === null ||
      (source.droppableId === "next" && destination.droppableId === "next")
    ) {
      return;
    }

    const playerId = socket.id;

    if (!playerId) {
      console.error("Player ID is not available");
      return;
    }
    const item = { ...state.next };

    if (source.droppableId === "next" && destination.droppableId === "played") {
      const newDeck = [...state.deck];
      const newPlayed = [...state.played];
      const { correct, delta } = checkCorrect(
        newPlayed,
        item,
        destination.index
      );
      newPlayed.splice(destination.index, 0, {
        ...state.next,
        played: { correct },
        moves: [{ playerId, timestamp: Date.now() }],
      });

      const newNext = state.nextButOne;
      const newNextButOne = getRandomItem(
        newDeck,
        newNext ? [...newPlayed, newNext] : newPlayed
      );
      const newImageCache: HTMLImageElement[] = newNextButOne?.image ? [preloadImage(newNextButOne.image)] : [];

      let badlyPlacedValue = correct
          ? null
          : {
              index: destination.index,
              rendered: false,
              delta,
            };

      const gameStateUpdate = {
        ...state,
        deck: newDeck,
        imageCache: newImageCache,
        next: newNext,
        nextButOne: newNextButOne,
        played: newPlayed,
        lives: correct ? state.lives : state.lives - 1,
        badlyPlaced: badlyPlacedValue,
      } as GameState;
      setState(gameStateUpdate);
      socket.emit("moveCard", {
        playerId,
        source,
        destination,
        itemId: item.id,
      });
    } else if (
      source.droppableId === "played" &&
      destination.droppableId === "played"
    ) {
      const newPlayed = [...state.played];
      const [movedItem] = newPlayed.splice(source.index, 1);

      movedItem.moves = [
        ...(movedItem.moves || []),
        { playerId, timestamp: Date.now() },
      ];
      newPlayed.splice(destination.index, 0, movedItem);

      const gameStateUpdate: GameState = {
        ...state,
        played: newPlayed,
        badlyPlaced: null,
      } as GameState;
      setState(gameStateUpdate);
      socket.emit("moveCard", {
        playerId,
        source,
        destination,
        itemId: movedItem.id,
      });
    }
  };

  // Ensure that newly placed items are rendered as draggables before trying to
  // move them to the right place if needed.
  useLayoutEffect(() => {
    if (state.badlyPlaced) {
      setState((prev: GameState) => {
        const newState: GameState = {
          ...prev,
          badlyPlaced: state.badlyPlaced === null ? null : {...state.badlyPlaced},
        };
        return newState;
      });
    }
  }, [setState, state.badlyPlaced]);

  const score = useMemo(() => {
    return state.played.filter((item) => item.played.correct).length - 1;
  }, [state.played]);

  useLayoutEffect(() => {
    if (score > highscore) {
      updateHighscore(score);
    }
  }, [score, highscore, updateHighscore]);

  return (
    <DragDropContext
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      sensors={[useAutoMoveSensor.bind(null, state)]}
    >
      <div className={styles.wrapper}>
        <div className={styles.top}>
          <Hearts lives={state.lives} />
          {state.lives > 0 ? (
            <>
              {state.next && <NextItemList next={state.next} />}
            </>
          ) : (
            <GameOver
              highscore={highscore}
              resetGame={resetGame}
              score={score}
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
