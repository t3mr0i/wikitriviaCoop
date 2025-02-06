import { Server } from 'socket.io';

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
  const fs = require('fs');
  const path = require('path');
  const { getRandomItem } = require('../../lib/items');
  const itemsPath = path.join(process.cwd(), 'public', 'items.json');
  const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
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

const SocketHandler = async (req: any, res: any) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
    return;
  }

  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  io.on('connection', async (socket) => {
    console.log('A user connected');

    socket.on('joinGame', async (callback) => {
      if (gameState.deck.length === 0) {
        await initializeDeck();
      }
      callback(gameState);
      socket.broadcast.emit('playerJoined', socket.id);
    });

    socket.on('moveCard', (msg) => {
      io.emit('updateGameState', msg);
    });
  });

  console.log('Socket is initializing');
  res.end();
};

export default SocketHandler;
