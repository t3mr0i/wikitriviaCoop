import React, { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Lobbies.module.css';
import { GameContext } from './_app';

interface Lobby {
  id: string;
  name: string;
  players: { id: string; name: string; isHost: boolean }[];
  createdAt: string;
  gameStarted: boolean;
  gameType: 'coop' | 'versus';
}

const Lobbies = () => {
  const router = useRouter();
  const { socket, playerName } = useContext(GameContext);
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lobbyName, setLobbyName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentLobby, setCurrentLobby] = useState<string | null>(null);
  const [gameType, setGameType] = useState<'coop' | 'versus'>('coop');
  const [category, setCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'video_games', name: 'Video Games' },
    { id: 'cars', name: 'Cars & Vehicles' },
    { id: 'sports', name: 'Sports' },
    { id: 'movies', name: 'Movies & Films' },
    { id: 'music', name: 'Music' }
  ];

  useEffect(() => {
    // Redirect to setup if no player name
    if (!playerName) {
      router.replace('/setup');
      return;
    }

    if (!socket) {
      setError('No connection to server');
      return;
    }

    // Check for pending lobby join
    const pendingLobbyId = typeof window !== 'undefined' ? sessionStorage.getItem('pendingLobbyJoin') : null;
    if (pendingLobbyId) {
      console.log('Found pending lobby join:', pendingLobbyId);
      sessionStorage.removeItem('pendingLobbyJoin');
      handleJoinLobby(pendingLobbyId);
    }

    // If socket is already connected, we can start setting up events
    if (socket.connected) {
      console.log('Socket is already connected, setting up events');
      setLoading(false);
      setError(null);
      // Request initial lobbies list
      socket.emit('requestLobbies');
    }

    // Set up event listeners
    const setupEventListeners = () => {
      console.log('Setting up socket event listeners');
      
      socket.on('connect', () => {
        console.log('Socket connected in Lobbies');
        setLoading(false);
        setError(null);
        // Request initial lobbies list
        socket.emit('requestLobbies');
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setLoading(false);
        setError('Failed to connect to game server. Please try again.');
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected in Lobbies');
        setLoading(true);
        setError('Disconnected from server. Reconnecting...');
      });

      socket.on('lobbiesUpdate', (updatedLobbies: Lobby[]) => {
        console.log('Received lobbies update:', updatedLobbies);
        setLobbies(updatedLobbies);
        setLoading(false);
      });

      socket.on('joinedLobby', ({ lobbyId, isHost }) => {
        console.log('Joined lobby:', lobbyId, 'isHost:', isHost);
        setCurrentLobby(lobbyId);
      });

      socket.on('gameStarting', ({ gameState }) => {
        console.log('Game is starting!', gameState);
        router.push(`/play/${gameState.lobbyId}`);
      });

      socket.on('playerJoined', ({ playerId, playerName, playerCount }) => {
        console.log(`Player ${playerName} (${playerId}) joined. Total players: ${playerCount}`);
      });

      socket.on('playerLeft', ({ playerId, playerCount }) => {
        console.log(`Player ${playerId} left. Total players: ${playerCount}`);
      });
    };

    setupEventListeners();

    // Cleanup function
    return () => {
      console.log('Cleaning up socket event listeners in Lobbies');
      if (socket) {
        socket.off('connect');
        socket.off('connect_error');
        socket.off('disconnect');
        socket.off('lobbiesUpdate');
        socket.off('joinedLobby');
        socket.off('gameStarting');
        socket.off('playerJoined');
        socket.off('playerLeft');
      }
    };
  }, [socket, router, playerName]);

  const handleCreateLobby = (e: React.FormEvent) => {
    e.preventDefault();
    if (socket && lobbyName.trim()) {
      socket.emit('createLobby', {
        name: lobbyName,
        playerName,
        gameType,
        category
      });
      setLobbyName('');
      setShowCreateForm(false);
    }
  };

  const handleJoinLobby = (lobbyId: string) => {
    if (socket) {
      socket.emit('joinLobby', { lobbyId, playerName });
    }
  };

  const handleStartGame = () => {
    if (socket && currentLobby) {
      socket.emit('startGame', currentLobby);
    }
  };

  // Show loading state only if we're actually loading and don't have lobbies yet
  if (loading && lobbies.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Connecting to server...</p>
        {error && <p className={styles.errorMessage}>{error}</p>}
      </div>
    );
  }

  if (error && !socket?.connected) {
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
        <div className={styles.playerInfo}>
          Playing as: {playerName}
        </div>
      </div>
      
      {currentLobby ? (
        <div className={styles.currentLobby}>
          <h2>Current Lobby: {lobbies.find(l => l.id === currentLobby)?.name}</h2>
          <div className={styles.inviteSection}>
            <p>Share this link to invite players:</p>
            <div className={styles.inviteLink}>
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/join/${currentLobby}`}
                className={styles.inviteLinkInput}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/join/${currentLobby}`);
                  // You could add a toast notification here
                }}
                className={styles.copyButton}
              >
                Copy
              </button>
            </div>
          </div>
          <div className={styles.playerList}>
            {lobbies.find(l => l.id === currentLobby)?.players.map(player => (
              <div key={player.id} className={styles.playerItem}>
                {player.name} {player.isHost && '(Host)'} {player.id === socket?.id && '(You)'}
              </div>
            ))}
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
              <div className={styles.inputGroup}>
                <label>Game Type</label>
                <div className={styles.gameTypeButtons}>
                  <button
                    type="button"
                    className={`${styles.gameTypeButton} ${gameType === 'coop' ? styles.active : ''}`}
                    onClick={() => setGameType('coop')}
                  >
                    Cooperative
                  </button>
                  <button
                    type="button"
                    className={`${styles.gameTypeButton} ${gameType === 'versus' ? styles.active : ''}`}
                    onClick={() => setGameType('versus')}
                    disabled
                  >
                    Versus
                    <span className={styles.comingSoon}>Coming Soon</span>
                  </button>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={styles.select}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
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
                      <div className={styles.lobbyDetails}>
                        <span>Game Type: {lobby.gameType || 'Coop'}</span>
                        <span>{lobby.gameStarted ? 'Game Started' : 'Waiting'}</span>
                      </div>
                      <div className={styles.playerCount}>
                        <span className={styles.playerIcon}>👥</span>
                        <span>{lobby.players.length} players</span>
                      </div>
                      <div className={styles.playerList}>
                        {lobby.players.map(player => (
                          <div key={player.id} className={styles.playerName}>
                            {player.name}
                          </div>
                        ))}
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
