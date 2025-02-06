import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Setup.module.css';
import { GameContext } from './_app';

const Setup = () => {
  const router = useRouter();
  const { playerName, setPlayerName } = useContext(GameContext);
  const [name, setName] = React.useState(playerName);
  const [gameType, setGameType] = React.useState<'coop' | 'versus'>('coop');

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
        <div className={styles.inputGroup}>
          <label>Game Type</label>
          <div className={styles.gameTypeButtons}>
            <button
              type="button"
              className={`${styles.gameTypeButton} ${gameType === 'coop' ? styles.active : ''}`}
              onClick={() => setGameType('coop')}
            >
              Cooperative
              <span className={styles.comingSoon}></span>
            </button>
            <button
              type="button"
              className={`${styles.gameTypeButton} ${gameType === 'versus' ? styles.active : ''}`}
              onClick={() => setGameType('versus')}
            
            >
              Versus
            </button>
          </div>
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