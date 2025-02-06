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
    console.log('a user connected');

    socket.on('createLobby', (lobbyData) => {
      const lobbyId = Date.now().toString();
      const lobby = {
        id: lobbyId,
        name: lobbyData.name || `Lobby ${lobbies.size + 1}`,
        players: [{ id: socket.id, isHost: true }],
        createdAt: new Date(),
        gameStarted: false
      };
      lobbies.set(lobbyId, lobby);
      socket.join(lobbyId);
      io.emit('lobbiesUpdate', Array.from(lobbies.values()));
      socket.emit('joinedLobby', { lobbyId, isHost: true });
    });

    socket.on('joinLobby', (lobbyId) => {
      const lobby = lobbies.get(lobbyId);
      if (lobby && !lobby.gameStarted) {
        lobby.players.push({ id: socket.id, isHost: false });
        socket.join(lobbyId);
        io.emit('lobbiesUpdate', Array.from(lobbies.values()));
        socket.emit('joinedLobby', { lobbyId, isHost: false });
        io.to(lobbyId).emit('playerJoined', { 
          playerId: socket.id, 
          playerCount: lobby.players.length 
        });
      }
    });

    socket.on('startGame', (lobbyId) => {
      const lobby = lobbies.get(lobbyId);
      if (lobby && lobby.players.find(p => p.id === socket.id)?.isHost) {
        lobby.gameStarted = true;
        const gameState = {
          lobbyId,
          players: lobby.players,
          currentRound: 0,
        };
        games.set(lobbyId, gameState);
        io.to(lobbyId).emit('gameStarting', { gameState });
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
