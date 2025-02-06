import React from 'react';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

const Home = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Wiki History Game</h1>
        <p className={styles.description}>
          Test your knowledge of historical events in this multiplayer timeline game.
        </p>
        <div className={styles.actions}>
          <Link href="/lobbies" className={styles.playButton}>
            Play Now
          </Link>
          <Link href="/how-to-play" className={styles.howToPlayButton}>
            How to Play
          </Link>
        </div>
      </div>
      <div className={styles.background}>
        <div className={styles.dotGrid}></div>
      </div>
    </div>
  );
};

export default Home;
