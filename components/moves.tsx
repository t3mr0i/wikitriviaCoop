import React from "react";
import styles from "../styles/moves.module.scss";

interface MovesProps {
  moves: { playerId: string; timestamp: number }[];
}

export default function Moves(props: MovesProps) {
  const { moves } = props;

  if (!moves || moves.length === 0) {
    return null;
  }

  return (
    <div className={styles.moves}>
      {moves.map((move, index) => (
        <div key={index} className={styles.move}>
          Player {move.playerId} moved at{" "}
          {new Date(move.timestamp).toLocaleTimeString()} ({moves.length} moves)
        </div>
      ))}
    </div>
  );
}
