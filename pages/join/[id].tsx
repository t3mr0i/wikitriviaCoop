import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GameContext } from '../_app';
import styles from '../../styles/Join.module.css';
import Link from 'next/link';

const JoinGame = () => {
  const router = useRouter();
  const { id } = router.query;
  const { playerName } = useContext(GameContext);

  useEffect(() => {
    if (!id) return;

    if (!playerName) {
      // Store the lobby ID in session storage before redirecting
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingLobbyJoin', id as string);
        router.replace('/setup');
      }
    } else {
      // If we have a player name, go directly to the lobbies page
      // The lobbies page will handle joining the lobby
      router.replace('/lobbies');
    }
  }, [id, playerName, router]);

  return (
    <div className={styles.container}>
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Redirecting to game...</p>
      </div>
    </div>
  );
};

export default JoinGame; 