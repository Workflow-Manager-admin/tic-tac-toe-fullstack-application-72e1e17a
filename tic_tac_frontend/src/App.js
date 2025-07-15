import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

/**
 * API base URL for backend communication.
 * Update if backend runs on a different host/port.
 */
const API_BASE_URL = 'http://localhost:3001';

const PRIMARY_COLOR = '#1976d2';
const SECONDARY_COLOR = '#424242';
const ACCENT_COLOR = '#f50057';

// --- Helper components and functions ---

// PUBLIC_INTERFACE
function Board({ board, onCellClick, disabled }) {
  // A 3x3 tic-tac-toe board, receives board state (array), click handler, and disables after result
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: 'repeat(3, 1fr)',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        maxWidth: 320,
        margin: '0 auto'
      }}
    >
      {board.map((row, r) =>
        row.map((cell, c) => (
          <button
            key={`${r}-${c}`}
            disabled={disabled || cell !== ''}
            onClick={() => onCellClick(r, c)}
            aria-label={`Row ${r + 1} Col ${c + 1}`}
            style={{
              width: 90,
              height: 90,
              fontSize: '2.2rem',
              color: cell === 'X' ? PRIMARY_COLOR : cell === 'O' ? ACCENT_COLOR : SECONDARY_COLOR,
              background: '#fff',
              border: `2px solid ${SECONDARY_COLOR}`,
              cursor: cell !== '' || disabled ? 'not-allowed' : 'pointer',
              borderRadius: 12,
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
          >
            {cell}
          </button>
        ))
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
function PlayerIndicator({ currentPlayer, status, winner }) {
  // Shows whose turn or result
  let text;
  if (status === 'win') {
    text = (
      <span>
        Winner: <span style={{ color: winner === 'X' ? PRIMARY_COLOR : ACCENT_COLOR }}>{winner}</span> 🎉
      </span>
    );
  } else if (status === 'draw') {
    text = <span>Draw Game 🤝</span>;
  } else {
    text = (
      <span>
        Turn: <span style={{ color: currentPlayer === 'X' ? PRIMARY_COLOR : ACCENT_COLOR }}>{currentPlayer}</span>
      </span>
    );
  }
  return (
    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: '18px 0 15px 0', minHeight: 32 }}>
      {text}
    </div>
  );
}

// PUBLIC_INTERFACE
function GameControls({ onNewGame, disabled, moves }) {
  // Button for creating a new game, show move count for context
  return (
    <div style={{ marginTop: 28, display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
      <button
        onClick={onNewGame}
        style={{
          padding: '10px 28px',
          background: PRIMARY_COLOR,
          color: '#fff',
          border: 'none',
          borderRadius: 7,
          fontWeight: 600,
          fontSize: '1.11rem',
          cursor: 'pointer',
          letterSpacing: '0.04em',
          boxShadow: '0px 1px 7px 0 #eaeaea60',
          transition: 'background 0.2s'
        }}
        aria-label="Start New Game"
        disabled={disabled}
      >
        New Game
      </button>
      <span style={{ opacity: 0.7, fontSize: '1em', minWidth: 86 }}>
        {/* Moves for visibility */}
        Moves: <strong>{moves}</strong>
      </span>
    </div>
  );
}

// PUBLIC_INTERFACE
function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{
      background: '#ffeaea',
      color: '#ce0033',
      padding: '10px 16px',
      borderRadius: 8,
      margin: '16px 0',
      fontWeight: 500,
      letterSpacing: '0.01em'
    }}>
      {message}
    </div>
  );
}

function LoadingSpinner({ text }) {
  return (
    <div style={{ margin: '34px 0', color: SECONDARY_COLOR }}>
      <div
        style={{
          display: 'inline-block',
          width: 36,
          height: 36,
          border: `4px solid ${SECONDARY_COLOR}`,
          borderTopColor: ACCENT_COLOR,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      <span style={{ marginLeft: 16, verticalAlign: 'middle', fontSize: '1.13rem', opacity: 0.88 }}>{text}</span>
      <style>
        {`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}
      </style>
    </div>
  );
}

// --- Main App Component ---

// PUBLIC_INTERFACE
function App() {
  // Theme logic (retained from existing file, to allow toggling light/dark)
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Tic-tac-toe state
  const [gameId, setGameId] = useState(null);
  const [board, setBoard] = useState([['', '', ''], ['', '', ''], ['', '', '']]);
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [status, setStatus] = useState('ongoing'); // ongoing, win, draw
  const [winner, setWinner] = useState(null);
  const [moves, setMoves] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Placeholder for future WebSocket or polling real-time
  const [pollInterval, setPollInterval] = useState(null);

  // Fetch game state (by id)
  const fetchGameState = useCallback(async (gid = gameId) => {
    if (!gid) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/game/${gid}`);
      if (!res.ok) throw new Error('Failed to fetch game state'); // Can expand error details
      const data = await res.json();
      if (data.board) {
        setBoard(data.board);
        setCurrentPlayer(data.current_player);
        setStatus(data.status);
        setWinner(data.winner);
        setMoves(data.moves);
        setGameId(data.id);
        setError('');
      }
    } catch (err) {
      setError(err.message || 'Could not fetch game state');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  // Start new game
  const startNewGame = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/game`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start new game');
      const data = await res.json();
      setGameId(data.id);
      setBoard(data.board);
      setCurrentPlayer(data.current_player);
      setStatus(data.status);
      setWinner(data.winner || null);
      setMoves(data.moves || 0);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not start a new game');
    } finally {
      setLoading(false);
    }
  }, []);

  // Make a move (row, col)
  const handleCellClick = async (r, c) => {
    if (status !== 'ongoing' || !gameId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId, row: r, col: c }),
      });
      if (!res.ok) throw new Error(`Move failed (${res.status})`);
      const data = await res.json();
      if (data.valid && data.state) {
        setBoard(data.state.board);
        setCurrentPlayer(data.state.current_player);
        setStatus(data.state.status);
        setWinner(data.state.winner || null);
        setMoves(data.state.moves);
        setError('');
      } else {
        // Move rejected by backend
        setError(data.error || 'Illegal move');
      }
    } catch (err) {
      setError(err.message || 'Could not submit move');
    } finally {
      setLoading(false);
    }
  };

  // Real-time: Poll state every 1.5s if ongoing (placeholder for WebSocket)
  useEffect(() => {
    if (!gameId || status !== 'ongoing') {
      if (pollInterval) clearInterval(pollInterval);
      setPollInterval(null);
      return;
    }
    // Defensive: do not schedule many intervals at once
    if (!pollInterval) {
      const interval = setInterval(() => {
        fetchGameState(gameId);
      }, 1500); // ~1.5s
      setPollInterval(interval);
      return () => clearInterval(interval);
    }
    // Cleanup when game ends
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [gameId, status, fetchGameState, pollInterval]);

  // Start a new game on component mount
  useEffect(() => {
    startNewGame();
    // eslint-disable-next-line
  }, []);

  // Main UI:
  return (
    <div className="App" style={{ minHeight: '100vh', background: '#fff' }}>
      <header
        className="App-header"
        style={{
          background: '#f8f9fa',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: '40px'
        }}
      >
        {/* Theme toggle retained from template */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <h1 style={{
          color: PRIMARY_COLOR,
          fontSize: '2.22rem',
          margin: '0 0 4px 0',
          letterSpacing: '-0.03em',
          userSelect: 'none'
        }}>
          Tic-Tac-Toe
        </h1>
        <div style={{
          color: SECONDARY_COLOR,
          marginBottom: 13,
          fontSize: '1.1em',
          letterSpacing: '0.01em'
        }}>
          Play against a friend (X vs O)
        </div>

        <PlayerIndicator currentPlayer={currentPlayer} status={status} winner={winner} />

        <ErrorBanner message={error} />

        {loading && <LoadingSpinner text="Loading..." />}

        <div style={{ opacity: loading ? 0.65 : 1.0, pointerEvents: loading ? 'none' : 'auto' }}>
          <Board
            board={board}
            onCellClick={handleCellClick}
            disabled={status !== 'ongoing' || loading}
          />
          <GameControls
            onNewGame={startNewGame}
            disabled={loading}
            moves={moves}
          />
        </div>

        {/* Info / API origin */}
        <footer style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          textAlign: 'center',
          fontSize: 13,
          color: '#5558',
          background: '#fff7',
          padding: 6,
          zIndex: 10,
          borderTop: '1px solid #eee'
        }}>
          Powered by FastAPI backend at <code>{API_BASE_URL}</code>
          <br />
          <span style={{ fontSize: 11, opacity: 0.7 }}>Frontend template by Kavia | {new Date().getFullYear()}</span>
        </footer>
      </header>
    </div>
  );
}

export default App;
