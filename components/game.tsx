import React, { useState, useEffect } from "react";
import axios from "axios";
import { GameState } from "../types/game";
import { Item } from "../types/item";
import createState from "../lib/create-state";
import Board from "./board";
import Loading from "./loading";
import Instructions from "./instructions";
import badCards from "../lib/bad-cards";
import io from "socket.io-client";
import { Socket } from 'socket.io-client';

interface GameProps {
  socket: Socket;
  gameId: string;
}

export default function Game({ socket, gameId }: GameProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [started, setStarted] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const [connected, setConnected] = useState(false);
  const [players, setPlayers] = useState<string[]>([]);

  useEffect(() => {
    if (!socket || !gameId) return;

    socket.on("connect", () => {
      console.log("connected to game:", gameId);
      setConnected(true);

      socket.emit("joinGame", { gameId }, (initialGameState: GameState) => {
        setGameState(initialGameState);
        setLoaded(true);
      });
    });

    socket.on("gameState", (newGameState: GameState) => {
      setGameState(newGameState);
    });

    socket.on("playerJoined", (playerId: string) => {
      setPlayers((prevPlayers) => [...prevPlayers, playerId]);
    });

    socket.on("playerLeft", (playerId: string) => {
      setPlayers((prevPlayers) => prevPlayers.filter((id) => id !== playerId));
    });

    socket.on("disconnect", () => {
      console.log("disconnected from game:", gameId);
      setConnected(false);
      setGameState(null);
      setPlayers([]);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket, gameId]);

  useEffect(() => {
    if (!socket || !gameId) return;

    socket.on("updateGameState", (newGameState: any) => {
      setGameState(newGameState);
    });
  }, [socket, gameId]);

  const resetGame = React.useCallback(() => {
    if (socket && gameId) {
      socket.emit("joinGame", { gameId }, (initialGameState: GameState) => {
        setGameState(initialGameState);
        setLoaded(true);
      });
    }
  }, [socket, gameId]);

  const [highscore, setHighscore] = React.useState<number>(
    Number(localStorage.getItem("highscore") ?? "0")
  );

  const updateHighscore = React.useCallback((score: number) => {
    localStorage.setItem("highscore", String(score));
    setHighscore(score);
  }, []);

  useEffect(() => {
    if (gameState && socket && gameId) {
      socket.emit("gameStateUpdate", { gameId, state: gameState });
    }
  }, [gameState, socket, gameId]);

  if (!loaded || gameState === null) {
    return <Loading />;
  }

  if (!started) {
    return (
      <Instructions highscore={highscore} start={() => setStarted(true)} />
    );
  }

  return (
    <>
      <p>Status: {connected ? "Connected" : "Disconnected"}</p>
      <p>Players: {players.length}</p>
      <Board
        highscore={highscore}
        state={gameState}
        setState={setGameState}
        resetGame={resetGame}
        updateHighscore={updateHighscore}
        socket={socket}
      />
    </>
  );
}
