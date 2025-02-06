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
          isHost: true 
        }],
        createdAt: new Date(),
        gameStarted: false,
        gameType: lobbyData.gameType || 'coop'
      };
      lobbies.set(lobbyId, lobby);
      socket.join(lobbyId);
      io.emit('lobbiesUpdate', Array.from(lobbies.values()));
      socket.emit('joinedLobby', { lobbyId, isHost: true });
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
        socket.emit('joinedLobby', { lobbyId, isHost: false });
        io.to(lobbyId).emit('playerJoined', { 
          playerId: socket.id,
          playerName: playerName || 'Anonymous',
          playerCount: lobby.players.length 
        });
      }
    });

    socket.on('startGame', (lobbyId) => {
      console.log('Starting game for lobby:', lobbyId);
      const lobby = lobbies.get(lobbyId);
      if (lobby && lobby.players.find(p => p.id === socket.id)?.isHost) {
        lobby.gameStarted = true;
        const gameState = {
          lobbyId,
          players: lobby.players,
          currentRound: 0,
          deck: [],
          played: [],
          next: null,
          nextButOne: null,
          lives: 3,
          badlyPlaced: null,
          gameType: lobby.gameType || 'coop'
        };
        console.log('Created initial game state:', gameState);
        games.set(lobbyId, gameState);
        io.to(lobbyId).emit('gameStarting', { gameState });
        io.to(lobbyId).emit('gameState', gameState);
      }
    });

    socket.on('joinGame', ({ gameId, playerName }, callback) => {
      console.log('Join game request for:', gameId, 'from socket:', socket.id, 'name:', playerName);
      
      try {
        const game = games.get(gameId);
        if (game) {
          console.log('Game found, joining room and sending state:', game);
          // Update player name if they're already in the game
          const existingPlayer = game.players.find(p => p.id === socket.id);
          if (existingPlayer) {
            existingPlayer.name = playerName;
          } else {
            game.players.push({ id: socket.id, name: playerName, isHost: false });
          }
          socket.join(gameId);
          callback(game);
          io.to(gameId).emit('gameState', game);
        } else {
          console.log('Game not found');
          callback(null);
        }
      } catch (error) {
        console.error('Error in joinGame handler:', error);
        callback(null);
      }
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
