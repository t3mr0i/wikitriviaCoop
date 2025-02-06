import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Setup.module.css';
import { GameContext } from './_app';

const Setup = () => {
  const router = useRouter();
  const { playerName, setPlayerName } = useContext(GameContext);
  const [name, setName] = React.useState(playerName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setPlayerName(name.trim());
      router.push('/lobbies');
    }
  };

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        ← Back
      </Link>
      <form onSubmit={handleSubmit} className={styles.setupForm}>
        <h1>Game Setup</h1>
        <div className={styles.inputGroup}>
          <label htmlFor="playerName">Your Name</label>
          <input
            id="playerName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className={styles.input}
            required
            minLength={2}
            maxLength={20}
          />
        </div>
        <button type="submit" className={styles.submitButton} disabled={!name.trim()}>
          Continue to Lobbies
        </button>
      </form>
      <div className={styles.background}>
        <div className={styles.dotGrid}></div>
      </div>
    </div>
  );
};

export default Setup; 