import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Lobbies.module.css';

interface Lobby {
  id: string;
  name: string;
  players: { id: string; isHost: boolean }[];
  createdAt: string;
  gameStarted: boolean;
}

const Lobbies = () => {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lobbyName, setLobbyName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentLobby, setCurrentLobby] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3003', {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      setLoading(false);
      setError(null);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setLoading(false);
      setError('Failed to connect to game server. Please try again.');
    });

    newSocket.on('lobbiesUpdate', (updatedLobbies: Lobby[]) => {
      console.log('Received lobbies update:', updatedLobbies);
      setLobbies(updatedLobbies);
    });

    newSocket.on('joinedLobby', ({ lobbyId, isHost }) => {
      console.log('Joined lobby:', lobbyId, 'isHost:', isHost);
      setCurrentLobby(lobbyId);
    });

    newSocket.on('gameStarting', ({ gameState }) => {
      console.log('Game is starting!', gameState);
      router.push(`/play/${gameState.lobbyId}`);
    });

    newSocket.on('playerJoined', ({ playerId, playerCount }) => {
      console.log(`Player ${playerId} joined. Total players: ${playerCount}`);
    });

    newSocket.on('playerLeft', ({ playerId, playerCount }) => {
      console.log(`Player ${playerId} left. Total players: ${playerCount}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [router]);

  const handleCreateLobby = (e: React.FormEvent) => {
    e.preventDefault();
    if (socket && lobbyName.trim()) {
      socket.emit('createLobby', { name: lobbyName });
      setLobbyName('');
      setShowCreateForm(false);
    }
  };

  const handleJoinLobby = (lobbyId: string) => {
    if (socket) {
      socket.emit('joinLobby', lobbyId);
    }
  };

  const handleStartGame = () => {
    if (socket && currentLobby) {
      socket.emit('startGame', currentLobby);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Connecting to server...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <Link href="/" className={styles.backButton}>
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>
          ← Back
        </Link>
        <h1 className={styles.title}>Game Lobbies</h1>
      </div>
      
      {currentLobby ? (
        <div className={styles.currentLobby}>
          <h2>Current Lobby: {lobbies.find(l => l.id === currentLobby)?.name}</h2>
          <div className={styles.playerCount}>
            <span className={styles.playerIcon}>👥</span>
            <span>{lobbies.find(l => l.id === currentLobby)?.players.length || 0} players</span>
          </div>
          {lobbies.find(l => l.id === currentLobby)?.players.find(p => p.id === socket?.id)?.isHost && (
            <button 
              className={styles.startButton}
              onClick={handleStartGame}
            >
              Start Game
            </button>
          )}
        </div>
      ) : (
        <>
          {!showCreateForm ? (
            <button 
              className={styles.createButton}
              onClick={() => setShowCreateForm(true)}
            >
              Create New Lobby
            </button>
          ) : (
            <form onSubmit={handleCreateLobby} className={styles.createForm}>
              <input
                type="text"
                value={lobbyName}
                onChange={(e) => setLobbyName(e.target.value)}
                placeholder="Enter lobby name"
                className={styles.input}
                required
              />
              <div className={styles.formButtons}>
                <button type="submit" className={styles.submitButton}>
                  Create
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowCreateForm(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className={styles.lobbiesList}>
            {lobbies.filter(lobby => !lobby.gameStarted).length === 0 ? (
              <p className={styles.noLobbies}>No active lobbies. Create one to get started!</p>
            ) : (
              lobbies
                .filter(lobby => !lobby.gameStarted)
                .map((lobby) => (
                  <div key={lobby.id} className={styles.lobbyCard}>
                    <div className={styles.lobbyInfo}>
                      <h3>{lobby.name}</h3>
                      <div className={styles.playerCount}>
                        <span className={styles.playerIcon}>👥</span>
                        <span>{lobby.players.length} players</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinLobby(lobby.id)}
                      className={styles.joinButton}
                    >
                      Join
                    </button>
                  </div>
                ))
            )}
          </div>
        </>
      )}
      <div className={styles.background}>
        <div className={styles.dotGrid}></div>
      </div>
    </div>
  );
};

export default Lobbies;
