import React from 'react';
import { useRouter } from 'next/router';
import Game from '../../components/game';
import styles from '../../styles/Play.module.css';

const PlayGame = ({ socket }: { socket: any }) => {
  const router = useRouter();
  const { id } = router.query;

  if (!socket) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Connecting to game server...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Game socket={socket} gameId={id as string} />
    </div>
  );
};

export default PlayGame; 