import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import Game from '../../components/game';
import styles from '../../styles/Play.module.css';
import { GameContext } from '../_app';
import Link from 'next/link';

const PlayGame = () => {
  const router = useRouter();
  const { id } = router.query;
  const { socket, playerName, gameState } = useContext(GameContext);

  useEffect(() => {
    // Redirect to setup if no player name
    if (!playerName && typeof window !== 'undefined') {
      sessionStorage.setItem('pendingGameJoin', id as string);
      router.replace('/setup');
    }
  }, [playerName, id, router]);

  if (!playerName) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Redirecting to setup...</p>
      </div>
    );
  }

  if (!socket) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Connecting to game server...</p>
      </div>
    );
  }

  if (!id) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>Invalid game ID</p>
        <Link href="/lobbies" className={styles.backButton}>
          Back to Lobbies
        </Link>
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
      <Game socket={socket} gameId={id as string} gameType={gameState.gameType} />
    </div>
  );
};

export default PlayGame;
