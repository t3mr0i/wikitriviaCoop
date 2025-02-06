import React from "react";
import { Player } from "../types/game";
import styles from "../styles/ranking.module.css";

interface Props {
  players: Player[];
  currentPlayerId: string;
}

const Ranking = ({ players, currentPlayerId }: Props) => {
  // Sort players by ranking if available
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.ranking === undefined || b.ranking === undefined) return 0;
    return a.ranking - b.ranking;
  });

  return (
    <div className={styles.rankingContainer}>
      <h2 className={styles.title}>Player Rankings</h2>
      <div className={styles.playerList}>
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`${styles.playerItem} ${
              player.id === currentPlayerId ? styles.currentPlayer : ''
            }`}
          >
            <div className={styles.playerInfo}>
              <span className={styles.rank}>{index + 1}</span>
              <span className={styles.name}>
                {player.name} {player.isHost && '(Host)'}
                {player.id === currentPlayerId && ' (You)'}
              </span>
            </div>
            {player.ranking !== undefined && (
              <span className={styles.score}>Score: {player.ranking}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ranking;
