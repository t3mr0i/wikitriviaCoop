import React from 'react';
import styles from '../styles/HowToPlay.module.scss';

const HowToPlay: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1>How to Play Wikitrivia</h1>

      <h2>Objective</h2>
      <p>Place the cards on the timeline in the correct order.</p>

      <h2>Gameplay</h2>
      <p>
        In this game, you put events from Wikipedia in a timeline.
      </p>
      <ul>
        <li>You are given a card with an event and its title.</li>
        <li>You must place the card in the correct position on the timeline.</li>
        <li>You have three lives (hearts).</li>
        <li>You lose a life if you place a card incorrectly.</li>
        <li>The game ends when you lose all three lives.</li>
      </ul>

      <h2>About Wikitrivia</h2>
      <p>
        Wikitrivia is a web game where you test your knowledge of historical
        dates. It pulls events from Wikidata and challenges you to arrange them
        chronologically.
      </p>
      <p>Created by Tom Watson.</p>
      <p>
        <i>
          "If you’re a history buff, or are looking for a new web game to play,
          Wikitrivia may be worth your time."
        </i>
      </p>
      <p>
        The game is not flawless, and some data may be incorrect. You are
        encouraged to contribute corrections to Wikipedia or Wikidata itself.
      </p>
    </div>
  );
};

export default HowToPlay;
