import React from "react";
import styles from "../styles/Instructions.module.css";
import Score from "./score";

interface Props {
  highscore: number;
  start: () => void;
}

export default function Instructions(props: Props) {
  const { highscore, start } = props;

  return (
    <div className={styles.instructions}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Wiki History Game</h1>
        <h2 className={styles.subtitle}>Place the cards on the timeline in the correct order.</h2>
        
        {highscore !== 0 && (
          <div className={styles.highscoreWrapper}>
            <Score score={highscore} title="Best streak" />
          </div>
        )}

        <button onClick={start} className={styles.startButton}>
          Start Game
        </button>

        <div className={styles.about}>
          <p>
            All data sourced from{" "}
            <a
              href="https://www.wikidata.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Wikidata
            </a>{" "}
            and{" "}
            <a
              href="https://www.wikipedia.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Wikipedia
            </a>
            .
          </p>
        </div>
      </div>
      <div className={styles.background}>
        <div className={styles.dotGrid}></div>
      </div>
    </div>
  );
}
