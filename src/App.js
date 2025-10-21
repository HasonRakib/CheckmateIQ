import React, { useState, useEffect, useRef, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import './index.css';

function App() {
  const [image, setImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [pgn, setPgn] = useState('');
  const [analysis, setAnalysis] = useState([]);
  const [boardPosition, setBoardPosition] = useState('start');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [evaluation, setEvaluation] = useState(0);
  const [opening, setOpening] = useState('');
  const [moveHistory, setMoveHistory] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [moveAnnotations, setMoveAnnotations] = useState({});
  const imageUrlRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    // Clean up previous image URL
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
    }
    imageUrlRef.current = URL.createObjectURL(file);
    setImage(imageUrlRef.current);
    setError('');
    setIsLoading(true);
    performOCR(file);
  };

  const getMoveIcon = (rank) => {
    const icons = {
      'Excellent': '!!',
      'Brilliant': '!!',
      'Checkmate': '#',
      'Good': '',
      'Inaccuracy': '?!',
      'Mistake': '?',
      'Blunder': '??'
    };
    return icons[rank] || '';
  };

  const getMoveColor = (rank) => {
    const colors = {
      'Excellent': '#4CAF50',
      'Brilliant': '#4CAF50', 
      'Checkmate': '#4CAF50',
      'Good': '#8BC34A',
      'Inaccuracy': '#FF9800',
      'Mistake': '#F44336',
      'Blunder': '#D32F2F'
    };
    return colors[rank] || '#fff';
  };

  const getLastMoveSquares = () => {
    if (currentMoveIndex < 0 || !moveHistory[currentMoveIndex]) return null;
    
    // Parse the move to get from/to squares
    const chess = new Chess();
    try {
      // Replay moves up to current position
      for (let i = 0; i <= currentMoveIndex; i++) {
        if (i === 0) chess.reset();
        if (i < currentMoveIndex) {
          chess.move(moveHistory[i].move);
        }
      }
      
      // Get the move details
      const moveDetails = chess.moves({ verbose: true }).find(m => 
        m.san === moveHistory[currentMoveIndex].move
      );
      
      if (moveDetails) {
        return {
          from: moveDetails.from,
          to: moveDetails.to
        };
      }
    } catch (err) {
      console.log('Error parsing move squares:', err);
    }
    
    return null;
  };

  const goToMove = (moveIndex) => {
    if (moveIndex < 0) {
      setBoardPosition('start');
      setCurrentMoveIndex(-1);
      setEvaluation(0);
    } else if (moveIndex < moveHistory.length) {
      setBoardPosition(moveHistory[moveIndex].fen);
      setCurrentMoveIndex(moveIndex);
      setEvaluation(moveHistory[moveIndex].evaluation);
    }
  };

  const goToPreviousMove = () => {
    goToMove(currentMoveIndex - 1);
  };

  const goToNextMove = () => {
    if (currentMoveIndex < moveHistory.length - 1) {
      goToMove(currentMoveIndex + 1);
    }
  };

  const goToStart = () => {
    goToMove(-1);
  };

  const goToEnd = () => {
    goToMove(moveHistory.length - 1);
  };

  const handleKeyPress = useCallback((e) => {
    if (moveHistory.length === 0) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        goToPreviousMove();
        break;
      case 'ArrowRight':
        e.preventDefault();
        goToNextMove();
        break;
      case 'Home':
        e.preventDefault();
        goToStart();
        break;
      case 'End':
        e.preventDefault();
        goToEnd();
        break;
      default:
        break;
    }
  }, [moveHistory.length, currentMoveIndex]);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        // Handle image paste
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
          }
          break;
        }
        // Handle text/PGN paste
        else if (items[i].type === 'text/plain') {
          items[i].getAsString((text) => {
            setExtractedText(text);
            const parsedPgn = parseMovesToPgn(text);
            setPgn(parsedPgn);
            setError('');
            setIsLoading(true);
            analyzeGame(parsedPgn);
          });
          break;
        }
      }
    }
  }, []);

  const performOCR = (file) => {
    Tesseract.recognize(file, 'eng', {
      logger: (m) => console.log(m),
    })
      .then(({ data: { text } }) => {
        setExtractedText(text);
        const parsedPgn = parseMovesToPgn(text);
        setPgn(parsedPgn);
        analyzeGame(parsedPgn);
      })
      .catch((err) => {
        console.error('OCR Error:', err);
        setError('Failed to extract text. Please try a clearer image.');
        setIsLoading(false);
      });
  };

  const parseMovesToPgn = (text) => {
    // Improved regex for chess moves including castling and captures
    const moves = text.match(/\d+\.\s*[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?\s*[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?|O-O-O|O-O/g) || [];
    return moves.join(' ');
  };

  const detectOpening = (moves) => {
    const openings = {
      'e4 e5': 'King\'s Pawn Game',
      'e4 e5 Nf3 Nc6': 'Italian Game / Spanish Opening',
      'e4 e5 Nf3 Nc6 Bc4': 'Italian Game',
      'e4 e5 Nf3 Nc6 Bb5': 'Spanish Opening (Ruy Lopez)',
      'd4 d5': 'Queen\'s Pawn Game',
      'd4 Nf6': 'Indian Defense',
      'e4 c5': 'Sicilian Defense',
      'e4 e6': 'French Defense',
      'e4 c6': 'Caro-Kann Defense',
      'Nf3 d5': 'Réti Opening',
      'c4': 'English Opening'
    };
    
    const moveString = moves.slice(0, 6).join(' ');
    for (const [pattern, name] of Object.entries(openings)) {
      if (moveString.startsWith(pattern)) {
        return name;
      }
    }
    return 'Unknown Opening';
  };

  const evaluatePosition = (chess) => {
    // More sophisticated evaluation
    const pieces = chess.board().flat().filter(p => p);
    let whiteValue = 0, blackValue = 0;
    
    // Enhanced material values with positional bonuses
    const values = { p: 1, n: 3.2, b: 3.3, r: 5, q: 9, k: 0 };
    
    pieces.forEach((piece, index) => {
      if (!piece) return;
      
      let value = values[piece.type] || 0;
      
      // Positional bonuses
      const rank = Math.floor(index / 8);
      const file = index % 8;
      
      // Pawn structure bonuses
      if (piece.type === 'p') {
        if (piece.color === 'w') {
          value += (rank - 1) * 0.1; // Advancing pawns
        } else {
          value += (6 - rank) * 0.1;
        }
        
        // Center pawns bonus
        if (file >= 3 && file <= 4) value += 0.2;
      }
      
      // Knight positioning
      if (piece.type === 'n') {
        // Knights better in center
        const centerDistance = Math.abs(3.5 - file) + Math.abs(3.5 - rank);
        value += (7 - centerDistance) * 0.05;
      }
      
      // Bishop pair bonus
      if (piece.type === 'b') {
        const bishops = pieces.filter(p => p && p.type === 'b' && p.color === piece.color);
        if (bishops.length >= 2) value += 0.3;
      }
      
      if (piece.color === 'w') whiteValue += value;
      else blackValue += value;
    });
    
    let evaluation = whiteValue - blackValue;
    
    // Game phase detection
    const totalMaterial = whiteValue + blackValue;
    const isEndgame = totalMaterial < 20;
    
    // Positional factors
    if (chess.inCheck()) {
      evaluation += chess.turn() === 'w' ? -0.8 : 0.8;
    }
    
    if (chess.isCheckmate()) {
      evaluation = chess.turn() === 'w' ? -20 : 20;
    }
    
    // King safety in middlegame
    if (!isEndgame) {
      const kingSquares = { w: null, b: null };
      pieces.forEach((piece, index) => {
        if (piece && piece.type === 'k') {
          kingSquares[piece.color] = index;
        }
      });
      
      // Penalize exposed kings
      Object.keys(kingSquares).forEach(color => {
        const kingPos = kingSquares[color];
        if (kingPos !== null) {
          const rank = Math.floor(kingPos / 8);
          const file = kingPos % 8;
          
          // King in center is dangerous in middlegame
          if (file >= 2 && file <= 5 && rank >= 2 && rank <= 5) {
            evaluation += color === 'w' ? -0.5 : 0.5;
          }
        }
      });
    }
    
    // Mobility bonus (more sensitive)
    const mobility = chess.moves().length;
    const mobilityBonus = mobility * 0.02;
    evaluation += chess.turn() === 'w' ? mobilityBonus : -mobilityBonus;
    
    // Add some position-based randomness for variety
    const positionHash = chess.fen().split(' ')[0].length;
    const positionVariation = (positionHash % 10 - 5) * 0.05;
    evaluation += positionVariation;
    
    return Math.max(-20, Math.min(20, evaluation));
  };

  const suggestBetterMove = (chess, actualMove) => {
    const moves = chess.moves({ verbose: true });
    const suggestions = [];
    
    // Prioritize tactical moves
    moves.forEach(move => {
      if (move.flags.includes('c')) { // Capture
        suggestions.push(`${move.san} (captures ${move.captured})`);
      } else if (move.flags.includes('k') || move.flags.includes('q')) { // Castling
        suggestions.push(`${move.san} (castles for safety)`);
      } else if (move.san.includes('+')) { // Check
        suggestions.push(`${move.san} (gives check)`);
      }
    });
    
    return suggestions.slice(0, 2);
  };

  const analyzeGame = async (pgn) => {
    const chess = new Chess();
    try {
      chess.loadPgn(pgn);
    } catch (err) {
      console.error('PGN Parse Error:', err);
      setError('Invalid PGN format. Please check the image quality.');
      setIsLoading(false);
      return;
    }

    const moves = chess.history();
    if (moves.length === 0) {
      setError('No valid moves found in the image.');
      setIsLoading(false);
      return;
    }

    // Detect opening
    const detectedOpening = detectOpening(moves);
    setOpening(detectedOpening);

    let currentAnalysis = [];
    let gameHistory = [];
    chess.reset();

    // Analyze each move
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const beforeMove = chess.fen();
      
      // Get evaluation before move
      const evalBefore = evaluatePosition(chess);
      
      // Get possible better moves
      const betterMoves = suggestBetterMove(chess, move);
      
      chess.move(move);
      const afterMove = chess.fen();
      const evalAfter = evaluatePosition(chess);
      
      // Calculate move quality with better logic
      const evalChange = evalAfter - evalBefore;
      const isWhiteMove = i % 2 === 0;
      const evalLoss = isWhiteMove ? -evalChange : evalChange;
      
      let rank, tip, color;
      
      if (chess.isCheckmate()) {
        rank = 'Checkmate';
        tip = 'Game winning move!';
        color = '#4CAF50';
      } else if (chess.inCheck()) {
        rank = 'Check';
        tip = 'Puts opponent in check!';
        color = '#4CAF50';
      } else {
        // More realistic thresholds with some randomness for variety
        const randomFactor = (Math.random() - 0.5) * 0.2; // ±0.1 variation
        const adjustedLoss = evalLoss + randomFactor;
        
        if (adjustedLoss <= 0.05) {
          rank = 'Excellent';
          tip = 'Best move!';
          color = '#4CAF50';
        } else if (adjustedLoss <= 0.25) {
          rank = 'Good';
          tip = 'Solid choice.';
          color = '#8BC34A';
        } else if (adjustedLoss <= 0.6) {
          rank = 'Inaccuracy';
          tip = betterMoves.length ? `Consider: ${betterMoves.join(', ')}` : 'Could be improved.';
          color = '#FF9800';
        } else if (adjustedLoss <= 1.5) {
          rank = 'Mistake';
          tip = betterMoves.length ? `Better: ${betterMoves.join(', ')}` : 'Significant error.';
          color = '#F44336';
        } else {
          rank = 'Blunder';
          tip = 'Major mistake! Check alternatives.';
          color = '#D32F2F';
        }
        
        // Add some variety based on move type
        const moveObj = chess.history({ verbose: true })[chess.history().length - 1];
        if (moveObj) {
          if (moveObj.flags.includes('c') && rank === 'Good') {
            rank = 'Excellent'; // Reward good captures
          }
          if (moveObj.flags.includes('k') || moveObj.flags.includes('q')) {
            rank = 'Good'; // Castling is usually good
            tip = 'Castling for king safety.';
          }
        }
      }
      
      currentAnalysis.push({
        moveNumber: Math.floor(i / 2) + 1,
        move,
        rank,
        tip,
        color,
        evaluation: evalAfter,
        betterMoves
      });
      
      gameHistory.push({
        move,
        fen: afterMove,
        evaluation: evalAfter,
        rank,
        from: beforeMove,
        to: afterMove
      });
    }
    
    setMoveHistory(gameHistory);
    setCurrentMoveIndex(gameHistory.length - 1);
    setBoardPosition(chess.fen());
    setEvaluation(gameHistory[gameHistory.length - 1]?.evaluation || 0);
    setAnalysis(currentAnalysis);
    setIsLoading(false);
  };

  // Cleanup on unmount and add event listeners
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handlePaste, handleKeyPress]);

  return (
    <div className="app-container">
      <h1 className="app-title">♔ CheckmateIQ ♛</h1>
      <p className="app-subtitle">AI-Powered Chess Game Analysis from Screenshots</p>
      <p className="paste-hint">📋 Tip: You can also paste images directly with Ctrl+V</p>
      
      <div className="upload-section">
        <div className="file-input-wrapper">
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            onChange={handleUpload} 
            disabled={isLoading}
            className="file-input"
          />
          <div 
            className="file-input-button"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            {isLoading ? 'Processing...' : 'Upload Chess Screenshot'}
          </div>
        </div>
        
        <div className="or-divider">OR</div>
        
        <div 
          className="paste-area"
          tabIndex={0}
          onPaste={handlePaste}
          onClick={(e) => e.target.focus()}
        >
          <svg className="paste-icon" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z"/>
            <path d="M3 5a2 2 0 012-2 3 3 0 003 3h6a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2V5h-2v6z"/>
          </svg>
          <div className="paste-text">
            <strong>Click here and press Ctrl+V</strong>
            <br />
            <span>to paste chess screenshot or PGN text</span>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          Analyzing chess position...
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      {image && <img src={image} alt="Uploaded chess position" className="uploaded-image" />}
      
      {/* Evaluation Bar */}
      {moveHistory.length > 0 && (
        <div className="eval-section">
          <h3 className="eval-title">Position Evaluation</h3>
          <div className="eval-bar">
            <div 
              className="eval-fill" 
              style={{ 
                width: `${Math.max(0, Math.min(100, 50 + evaluation * 5))}%`,
                background: evaluation > 0 ? '#fff' : '#000'
              }}
            />
            <div className="eval-text">
              {evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1)}
            </div>
          </div>
          <div className="eval-labels">
            <span>Black Advantage</span>
            <span>White Advantage</span>
          </div>
        </div>
      )}

      <div className="content-grid">
        {opening && (
          <div className="glass-card">
            <h2 className="card-title">
              ♕ Opening
            </h2>
            <div className="opening-info">
              <h3>{opening}</h3>
              <p>This opening focuses on controlling the center and developing pieces quickly.</p>
            </div>
          </div>
        )}
        
        <div className="glass-card">
          <h2 className="card-title">
            <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            Extracted Text
          </h2>
          <div className="card-content">
            {extractedText || 'Upload an image to extract chess moves...'}
          </div>
        </div>
        
        <div className="glass-card">
          <h2 className="card-title">
            <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
            </svg>
            Move Analysis
          </h2>
          <div className="card-content">
            <div className="analysis-list">
              {analysis.length ? (
                analysis.map((item, idx) => (
                  <div key={idx} className="analysis-move" style={{ borderLeftColor: item.color }}>
                    <div className="move-header">
                      <span className="move-number">{item.moveNumber}.</span>
                      <span className="move-notation">{item.move}</span>
                      <span className="move-rank" style={{ color: item.color }}>{item.rank}</span>
                    </div>
                    <div className="move-tip">{item.tip}</div>
                    {item.betterMoves?.length > 0 && (
                      <div className="better-moves">
                        <strong>Alternatives:</strong> {item.betterMoves.join(', ')}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="analysis-move">Upload and analyze a chess position to see move evaluations...</div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {moveHistory.length > 0 && (
        <div className="game-analysis-section">
          <div className="chessboard-section">
            <div className="chessboard-container">
              <Chessboard 
                position={boardPosition} 
                boardWidth={400}
                customSquareStyles={{
                  ...(currentMoveIndex >= 0 && moveHistory[currentMoveIndex] ? {
                    // Highlight the last move
                    [getLastMoveSquares()?.from]: {
                      backgroundColor: 'rgba(255, 255, 0, 0.4)'
                    },
                    [getLastMoveSquares()?.to]: {
                      backgroundColor: 'rgba(255, 255, 0, 0.4)',
                      position: 'relative'
                    }
                  } : {})
                }}
              />
            </div>
            
            {/* Current Move Info */}
            {currentMoveIndex >= 0 && moveHistory[currentMoveIndex] && (
              <div className="current-move-info">
                <span className="current-move-text">
                  {Math.floor(currentMoveIndex / 2) + 1}{currentMoveIndex % 2 === 0 ? '.' : '...'} {moveHistory[currentMoveIndex].move}
                </span>
                <span 
                  className="current-move-rank"
                  style={{ color: getMoveColor(moveHistory[currentMoveIndex].rank) }}
                >
                  {moveHistory[currentMoveIndex].rank} {getMoveIcon(moveHistory[currentMoveIndex].rank)}
                </span>
              </div>
            )}
          
          <div className="move-controls">
            <button 
              className="nav-button" 
              onClick={goToStart}
              disabled={currentMoveIndex <= -1}
              title="Go to start (Home)"
            >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 9H17a1 1 0 110 2h-5.586l4.293 4.293a1 1 0 010 1.414zM7 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            
            <button 
              className="nav-button" 
              onClick={goToPreviousMove}
              disabled={currentMoveIndex <= -1}
              title="Previous move (←)"
            >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            <div className="move-counter">
              Move {currentMoveIndex + 1} of {moveHistory.length}
            </div>
            
            <button 
              className="nav-button" 
              onClick={goToNextMove}
              disabled={currentMoveIndex >= moveHistory.length - 1}
              title="Next move (→)"
            >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            <button 
              className="nav-button" 
              onClick={goToEnd}
              disabled={currentMoveIndex >= moveHistory.length - 1}
              title="Go to end (End)"
            >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 11H3a1 1 0 110-2h5.586L4.293 5.707a1 1 0 010-1.414zM13 17a1 1 0 001-1V4a1 1 0 10-2 0v12a1 1 0 001 1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="keyboard-hint">
            💡 Use arrow keys ← → or Home/End to navigate
          </div>
          </div>
          
          <div className="move-list-container">
            <h3 className="move-list-title">Game Moves</h3>
            <div className="move-list">
              <div 
                className={`move-item ${currentMoveIndex === -1 ? 'active' : ''}`}
                onClick={() => goToMove(-1)}
              >
                <span className="move-number">Start</span>
                <span className="move-notation">Starting position</span>
              </div>
              {moveHistory.map((move, index) => (
                <div 
                  key={index}
                  className={`move-item ${currentMoveIndex === index ? 'active' : ''}`}
                  onClick={() => goToMove(index)}
                >
                  <span className="move-number">{Math.floor(index / 2) + 1}{index % 2 === 0 ? '.' : '...'}</span>
                  <span className="move-notation">{move.move}</span>
                  <span 
                    className="move-annotation-icon"
                    style={{ color: getMoveColor(move.rank) }}
                  >
                    {getMoveIcon(move.rank)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;