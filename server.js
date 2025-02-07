const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();
const port = parseInt(process.env.PORT || '3003', 10);

// Load items data
const items = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'items.json'), 'utf8'));

// Helper function to get random items
function getRandomItems(count) {
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Helper function to get a random item not in the used items
function getRandomItem(usedItems = []) {
  const usedIds = new Set(usedItems.map(item => item.id));
  const availableItems = items.filter(item => !usedIds.has(item.id));
  if (availableItems.length === 0) return null;
  return availableItems[Math.floor(Math.random() * availableItems.length)];
}

// Helper function to initialize a new game state
function initializeGameState(players, category = 'all', gameType = 'coop') {
  const deck = getRandomItemsForCategory(50, category);
  console.log('Initializing game state with deck:', {
    category,
    deckSize: deck.length,
    totalItems: items.length
  });

  if (deck.length < 2) {
    console.error('Not enough items for category:', category);
    return null;
  }

  const [next, ...remainingDeck] = deck;
  const nextButOne = remainingDeck[0];
  remainingDeck.splice(0, 1);

  const gameState = {
    players,
    currentRound: 0,
    deck: remainingDeck,
    played: [{
      id: 'start',
      label: 'Start',
      year: 0,
      date: new Date(0).toISOString(),
      image: null,
      instance_of: ['start'],
      description: 'Starting point',
      played: { correct: true }
    }],
    next,
    nextButOne,
    lives: 3,
    badlyPlaced: null,
    gameType,
    category
  };

  console.log('Created game state:', {
    deckSize: gameState.deck.length,
    hasNext: !!gameState.next,
    nextId: gameState.next?.id,
    nextButOneId: gameState.nextButOne?.id
  });

  return gameState;
}

// Helper function to check if an item matches a category
function itemMatchesCategory(item, category) {
  if (!item.instance_of) return false;
  
  const instancesLower = item.instance_of.map(i => i.toLowerCase());
  
  switch(category) {
    case 'video_games':
      return instancesLower.some(i => 
        i.includes('video game') || 
        i.includes('videogame') || 
        i.includes('game company') ||
        i.includes('game developer')
      );
    case 'cars':
      return instancesLower.some(i => 
        i.includes('car') || 
        i.includes('automobile') || 
        i.includes('vehicle manufacturer')
      );
    case 'sports':
      return instancesLower.some(i => 
        i.includes('football') || 
        i.includes('soccer') || 
        i.includes('athlete') ||
        i.includes('sports team')
      );
    case 'movies':
      return instancesLower.some(i => 
        i.includes('film') || 
        i.includes('movie') || 
        i.includes('actor') ||
        i.includes('director')
      );
    case 'music':
      return instancesLower.some(i => 
        i.includes('musician') || 
        i.includes('band') || 
        i.includes('singer') ||
        i.includes('composer')
      );
    default:
      return true;
  }
}

// Helper function to get random items for a specific category
function getRandomItemsForCategory(count, category) {
  const categoryItems = items.filter(item => itemMatchesCategory(item, category));
  const shuffled = [...categoryItems].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Store active lobbies and games
const lobbies = new Map();
const games = new Map();

nextApp.prepare().then(() => {
  const app = express();
  const server = http.createServer(app);
  
  // Initialize Socket.IO with proper CORS and path
  const io = new Server(server, {
    path: '/api/socketio',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    // Send initial lobbies list when requested
    socket.on('requestLobbies', () => {
      console.log('Lobbies list requested by:', socket.id);
      socket.emit('lobbiesUpdate', Array.from(lobbies.values()));
    });

    socket.on('createLobby', (lobbyData) => {
      console.log('Creating lobby:', lobbyData);
      const lobbyId = Date.now().toString();
      const lobby = {
        id: lobbyId,
        name: lobbyData.name || `Lobby ${lobbies.size + 1}`,
        players: [{ 
          id: socket.id, 
          name: lobbyData.playerName || 'Anonymous',
          isHost: true,
          lives: 3,
          ready: false,
          ranking: 0
        }],
        createdAt: new Date(),
        gameStarted: false,
        gameType: lobbyData.gameType || 'coop',
        category: lobbyData.category || 'all'
      };

      // Initialize game state immediately
      const deck = getRandomItemsForCategory(50, lobby.category);
      console.log('Generated initial deck:', deck.length, 'items for category:', lobby.category);
      
      if (deck.length < 2) {
        console.error('Not enough items for category:', lobby.category);
        socket.emit('error', 'Not enough items in selected category');
        return;
      }

      const [next, ...remainingDeck] = deck;
      const nextButOne = remainingDeck[0];
      remainingDeck.splice(0, 1);

      const gameState = {
        lobbyId,
        players: lobby.players,
        currentRound: 0,
        deck: remainingDeck,
        played: [{
          id: 'start',
          label: 'Start',
          year: 0,
          date: new Date(0).toISOString(),
          image: null,
          instance_of: ['start'],
          description: 'Starting point',
          played: { correct: true }
        }],
        next,
        nextButOne,
        lives: 3,
        badlyPlaced: null,
        gameType: lobby.gameType || 'coop',
        category: lobby.category
      };

      lobbies.set(lobbyId, lobby);
      games.set(lobbyId, gameState);
      
      socket.join(lobbyId);
      io.emit('lobbiesUpdate', Array.from(lobbies.values()));
      socket.emit('joinedLobby', { lobbyId, isHost: true });
      socket.emit('gameState', gameState);
    });

    socket.on('joinLobby', ({ lobbyId, playerName }) => {
      const lobby = lobbies.get(lobbyId);
      if (lobby && !lobby.gameStarted) {
        lobby.players.push({ 
          id: socket.id, 
          name: playerName || 'Anonymous',
          isHost: false 
        });
        socket.join(lobbyId);
        io.emit('lobbiesUpdate', Array.from(lobbies.values()));
        io.to(lobbyId).emit('playerJoined', { 
          playerId: socket.id,
          playerName: playerName || 'Anonymous',
          playerCount: lobby.players.length 
        });
      }
    });

    socket.on('joinGame', ({ gameId, playerName }, callback) => {
      console.log('Join game request for:', gameId, 'from socket:', socket.id, 'name:', playerName);
      
      try {
        let game = games.get(gameId);
        
        // Create new game if it doesn't exist
        if (!game) {
          const player = {
            id: socket.id,
            name: playerName,
            isHost: true,
            lives: 3,
            ready: false,
            ranking: 0
          };
          
          game = initializeGameState([player]);
          if (!game) {
            console.error('Failed to initialize game state');
            callback(null);
            return;
          }
          game.lobbyId = gameId;
          games.set(gameId, game);
        } else {
          // Update player name if they're already in the game
          const existingPlayer = game.players.find(p => p.id === socket.id);
          if (existingPlayer) {
            existingPlayer.name = playerName;
          } else {
            game.players.push({
              id: socket.id,
              name: playerName,
              isHost: game.players.length === 0,
              lives: 3,
              ready: false,
              ranking: 0
            });
          }

          // Reinitialize game state if needed
          if (!game.deck || game.deck.length === 0 || !game.next) {
            const updatedGame = initializeGameState(game.players, game.category, game.gameType);
            if (!updatedGame) {
              console.error('Failed to reinitialize game state');
              callback(null);
              return;
            }
            game = { ...updatedGame, lobbyId: gameId };
            games.set(gameId, game);
          }
        }

        console.log('Sending game state:', {
          deckSize: game.deck.length,
          next: game.next?.id,
          nextButOne: game.nextButOne?.id,
          playedCount: game.played.length
        });

        socket.join(gameId);
        callback(game);
        io.to(gameId).emit('gameState', game);
      } catch (error) {
        console.error('Error in joinGame handler:', error);
        callback(null);
      }
    });

    socket.on('startGame', (gameId) => {
      console.log('Starting game:', gameId);
      let game = games.get(gameId);
      
      // If no game exists, create a new one
      if (!game) {
        console.log('No existing game found, creating new game');
        const player = {
          id: socket.id,
          name: 'Player 1',
          isHost: true,
          lives: 3,
          ready: false,
          ranking: 0
        };
        
        game = initializeGameState([player]);
        if (!game) {
          console.error('Failed to initialize new game');
          socket.emit('error', 'Failed to initialize game');
          return;
        }
        game.lobbyId = gameId;
        games.set(gameId, game);
        console.log('Created new game:', {
          gameId,
          deckSize: game.deck.length,
          hasNext: !!game.next,
          category: game.category
        });
      }
      
      // If game exists but has no deck, reinitialize it
      if (!game.deck || game.deck.length === 0 || !game.next) {
        console.log('Game exists but needs reinitialization:', {
          hasDeck: !!game.deck,
          deckSize: game.deck?.length,
          hasNext: !!game.next,
          category: game.category
        });
        
        const updatedGame = initializeGameState(game.players, game.category, game.gameType);
        if (!updatedGame) {
          console.error('Failed to reinitialize existing game');
          socket.emit('error', 'Failed to initialize game');
          return;
        }
        game = { ...updatedGame, lobbyId: gameId };
        games.set(gameId, game);
        console.log('Reinitialized game:', {
          gameId,
          deckSize: game.deck.length,
          hasNext: !!game.next,
          category: game.category
        });
      }

      console.log('Game started with state:', {
        deckSize: game.deck.length,
        next: game.next?.id,
        nextButOne: game.nextButOne?.id,
        category: game.category,
        players: game.players.length
      });
      
      socket.join(gameId);
      io.to(gameId).emit('gameState', game);
    });

    socket.on('gameStateUpdate', ({ gameId, state }) => {
      const game = games.get(gameId);
      if (game) {
        games.set(gameId, state);
        socket.to(gameId).emit('gameState', state);
      }
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
      lobbies.forEach((lobby, lobbyId) => {
        const playerIndex = lobby.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          lobby.players.splice(playerIndex, 1);
          if (lobby.players.length === 0) {
            lobbies.delete(lobbyId);
            games.delete(lobbyId);
          } else if (lobby.players[0]) {
            lobby.players[0].isHost = true;
          }
          io.emit('lobbiesUpdate', Array.from(lobbies.values()));
          io.to(lobbyId).emit('playerLeft', { 
            playerId: socket.id, 
            playerCount: lobby.players.length 
          });
        }
      });
    });
  });

  // Handle Next.js requests
  app.all('*', (req, res) => {
    return nextHandler(req, res);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
