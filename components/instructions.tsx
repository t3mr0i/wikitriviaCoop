import React from "react";
import styles from "../styles/Instructions.module.css";

interface Props {
  start: () => void;
}

const Instructions: React.FC<Props> = ({ start }) => {
  return (
    <div className={styles.instructions}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Wiki History Game</h1>
        <h2 className={styles.subtitle}>Place the cards on the timeline in the correct order.</h2>
        
        <div className={styles.rules}>
          <h3>How to Play:</h3>
          <ol>
            <li>Look at the card shown at the top</li>
            <li>Drag it to where you think it belongs in the timeline</li>
            <li>If you're correct, the card stays and you get a new one</li>
            <li>If you're wrong, you lose a life</li>
            <li>Work together to build the longest timeline!</li>
          </ol>
        </div>

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
};

export default Instructions;
