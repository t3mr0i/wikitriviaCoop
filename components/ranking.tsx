import React from "react";
import { Player } from "../types/game";
import styles from "../styles/ranking.module.scss";

interface Props {
  players: Player[];
}

export default function Ranking(props: Props) {
  const { players } = props;

  return (
    <div className={styles.ranking}>
      <h3>Ranking:</h3>
      <ol>
        {players
          .sort((a, b) => (a.ranking || 0) - (b.ranking || 0))
          .map((player) => (
            <li key={player.id}>
              {player.name}: {player.lives} lives
            </li>
          ))}
      </ol>
    </div>
  );
}
