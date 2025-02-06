const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fetch = require('node-fetch');
const { checkCorrect, getRandomItem } = require('./lib/items');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST'],
  },
});

const port = process.env.PORT || 3001;

let gameState = {
  badlyPlaced: null,
  deck: [],
  imageCache: [],
  lives: 3,
  next: null,
  nextButOne: null,
  played: [],
};

async function initializeDeck() {
    const itemsResponse = await fetch('http://localhost:3003/items.json'); // Assuming Next.js is running on port 3003
    const items = await itemsResponse.json();
    gameState.deck = items;
    gameState.played = [
      { ...getRandomItem(gameState.deck, []), played: { correct: true } },
    ];
    gameState.next = getRandomItem(gameState.deck, gameState.played);
    gameState.nextButOne = getRandomItem(gameState.deck, [
      ...gameState.played,
      gameState.next,
    ]);
}

io.on('connection', (socket) => {
  console.log('a user connected');

    socket.on('joinGame', async (callback) => {
    if (gameState.deck.length === 0) {
      await initializeDeck();
    }
    callback(gameState);
    socket.broadcast.emit('playerJoined', socket.id);
  });

  socket.on(
    'moveCard',
    (data) => {
      const { playerId, source, destination, itemId } = data;

      if (
        !destination ||
        gameState.next === null ||
        (source.droppableId === 'next' && destination.droppableId === 'next')
      ) {
        return;
      }

      let item;

      if (source.droppableId === 'next') {
        item = { ...gameState.next };
      } else {
        const playedItem = gameState.played.find((i) => i.id === itemId);
        if (!playedItem) {
          console.error("Couldn't find played item with id", itemId);
          return;
        }
        item = { ...playedItem };
      }

      if (
        source.droppableId === 'next' &&
        destination.droppableId === 'played'
      ) {
        const newDeck = [...gameState.deck];
        const newPlayed = [...gameState.played];
        const { correct } = checkCorrect(
          newPlayed,
          item,
          destination.index
        );
        const playedItem = {
          ...gameState.next,
          played: { correct },
          moves: [{ playerId, timestamp: Date.now() }],
        };
        newPlayed.splice(destination.index, 0, playedItem);

        const newNext = gameState.nextButOne;
        const newNextButOne = getRandomItem(
          newDeck,
          newNext ? [...newPlayed, newNext] : newPlayed
        );

        gameState = {
          ...gameState,
          deck: newDeck,
          imageCache: [],
          next: newNext,
          nextButOne: newNextButOne,
          played: newPlayed,
          lives: correct ? gameState.lives : gameState.lives - 1,
          badlyPlaced: correct
            ? null
            : {
                index: destination.index,
                rendered: false,
                delta: 0, // Assuming delta is not critical for multiplayer
              },
        };
      } else if (
        source.droppableId === 'played' &&
        destination.droppableId === 'played'
      ) {
        const newPlayed = [...gameState.played];
        const [movedItem] = newPlayed.splice(source.index, 1);

        movedItem.moves = [
          ...(movedItem.moves || []),
          { playerId, timestamp: Date.now() },
        ];
        newPlayed.splice(destination.index, 0, movedItem);

        gameState = {
          ...gameState,
          played: newPlayed,
          badlyPlaced: null,
        };
      }

      io.emit('gameState', gameState);
    }
  );
    socket.on('gameStateUpdate', (newGameState) => {
        gameState = newGameState;
        socket.broadcast.emit('gameState', gameState)
    });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    socket.broadcast.emit('playerLeft', socket.id);
  });
});

server.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}`);
});
