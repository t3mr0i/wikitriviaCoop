import { Server } from 'socket.io';
import { getRandomItem } from '../../lib/items';
import { GameState, Item, PlayedItem, Player } from '../../types/game';

interface ServerGameState {
  lobbyId: string;
  players: Player[];
  currentRound: number;
  badlyPlaced: null | { index: number; rendered: boolean; delta: number };
  deck: Item[];
  imageCache: HTMLImageElement[];
  next: Item | null;
  nextButOne: Item | null;
  played: PlayedItem[];
  gameType?: 'coop' | 'versus';
}

let gameState: ServerGameState = {
  lobbyId: 'default',
  players: [],
  currentRound: 0,
  badlyPlaced: null,
  deck: [],
  imageCache: [],
  next: null,
  nextButOne: null,
  played: [],
  gameType: 'coop',
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

    socket.on('joinGame', async (data: { gameId: string; playerName: string }, callback: (gameState: ServerGameState) => void) => {
      const { gameId, playerName } = data;
      if (gameState.deck.length === 0) {
        await initializeDeck();
      }

      const player: Player = {
        id: socket.id,
        name: playerName,
        isHost: gameState.players.length === 0,
        lives: 3,
        ready: false,
      };
      gameState.players.push(player);

      callback(gameState);
      io.emit('gameState', gameState);
    });

    socket.on('createLobby', async (data: { name: string; playerName: string; gameType: 'coop' | 'versus' }) => {
      const { name, playerName, gameType } = data;
      gameState.lobbyId = name;
      gameState.gameType = gameType;
      gameState.players = [];
      const player: Player = {
        id: socket.id,
        name: playerName,
        isHost: true,
        lives: 3,
        ready: false,
      };
      gameState.players.push(player);
      io.emit('gameState', gameState);
      io.emit('lobbiesUpdate', getLobbies());
    });

    socket.on('moveCard', (msg) => {
      const { playerId, source, destination, itemId } = msg;

      if (source.droppableId === 'next' && destination.droppableId === 'played') {
        const item = gameState.next;
        if (item && item.id === itemId) {
          const newDeck = [...gameState.deck];
          const newPlayed = [...gameState.played];
          // Basic checkCorrect implementation - replace with actual logic if needed
          const correct = newPlayed.length === destination.index;
          newPlayed.splice(destination.index, 0, {
            ...gameState.next!,
            played: { correct },
            moves: [{ playerId, timestamp: Date.now() }],
          });

          gameState.next = gameState.nextButOne;
          gameState.nextButOne = getRandomItem(newDeck, [...newPlayed, gameState.next!]);

          gameState.deck = newDeck;
          gameState.played = newPlayed;
          // gameState.lives = correct ? gameState.lives : gameState.lives - 1;
          gameState.badlyPlaced = null; // Reset badlyPlaced

          io.emit('gameState', gameState);
        }
      } else if (source.droppableId === 'played' && destination.droppableId === 'played') {
        const newPlayed = [...gameState.played];
        const [movedItem] = newPlayed.splice(source.index, 1);
        movedItem.moves = [...(movedItem.moves || []), { playerId, timestamp: Date.now() }];
        newPlayed.splice(destination.index, 0, movedItem);
        gameState.played = newPlayed;
        gameState.badlyPlaced = null;

        io.emit('gameState', gameState);
      }
    });

    socket.on('setReady', (ready: boolean) => {
      const player = gameState.players.find((p) => p.id === socket.id);
      if (player) {
        player.ready = ready;
        io.emit('gameState', gameState);
      }
    });

    socket.on('placeCard', async () => {
      const player = gameState.players.find((p) => p.id === socket.id);
      if (player) {
        player.ready = true;
        io.emit('gameState', gameState);

        // Check if all players are ready
        if (gameState.players.every((p) => p.ready)) {
          // Reset ready status for all players
          gameState.players.forEach((p) => (p.ready = false));

          // Move to the next round
          gameState.currentRound++;

          // Basic checkCorrect implementation - replace with actual logic if needed
          // gameState.lives = correct ? gameState.lives : gameState.lives - 1;
          gameState.badlyPlaced = null; // Reset badlyPlaced

          // Determine the winner and track the ranking
          let alivePlayers = gameState.players.filter((p) => p.lives > 0);
          if (alivePlayers.length === 1) {
            // We have a winner
            console.log('We have a winner:', alivePlayers[0].name);
            // Implement ranking logic here
            gameState.players.forEach(player => {
              if (player.id === alivePlayers[0].id) {
                player.ranking = 1; // The winner gets the first rank
              } else {
                player.ranking = 2; // Losers get the second rank
              }
            });
          } else if (alivePlayers.length === 0) {
            console.log('No players alive');
          } else {
            gameState.players = alivePlayers;
          }

          // Reset the game state for a new round
          gameState.deck = [];
          gameState.played = [];
          gameState.next = null;
          gameState.nextButOne = null;
          await initializeDeck();

          io.emit('gameState', gameState);
        }
      }
    });
  });

  console.log('Socket is initializing');
  res.end();
};

const getLobbies = () => {
  return [{
    id: gameState.lobbyId,
    name: gameState.lobbyId,
    players: gameState.players,
    createdAt: new Date().toISOString(),
    gameStarted: false,
    gameType: gameState.gameType,
  }]
}

export default SocketHandler;
