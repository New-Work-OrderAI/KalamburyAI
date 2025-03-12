import React, { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';
import DrawingCanvas from './components/DrawingCanvas';
import PromptGenerator from './components/PromptGenerator';
import GuessDisplay from './components/GuessDisplay';
import AIChat from './components/AIChat';
import AIRanking from './components/AIRanking';
import Timer from './components/Timer';
import { generatePrompt, guessDrawingWithAllModels, AI_MODELS } from './services/aiService';

// Constants
const DRAWING_TIME_LIMIT = 60; // 1 minute in seconds
const ANALYSIS_INTERVAL = 1000; // 1 second in milliseconds
const POINTS_PER_CORRECT_GUESS = 1;

function App() {
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [aiGuess, setAiGuess] = useState('');
  const [isGuessing, setIsGuessing] = useState(false);
  const [gameState, setGameState] = useState('start'); // start, drawing, guessing, result
  const [modelGuesses, setModelGuesses] = useState({});
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [aiModels, setAiModels] = useState(AI_MODELS);
  const [correctModels, setCorrectModels] = useState([]);
  const [hasCorrectGuess, setHasCorrectGuess] = useState(false);
  
  const canvasRef = useRef(null);
  const analysisIntervalRef = useRef(null);
  const hasDrawnRef = useRef(false);

  // Load scores from localStorage on initial load
  useEffect(() => {
    const savedScores = localStorage.getItem('aiPictionaryScores');
    if (savedScores) {
      try {
        const parsedScores = JSON.parse(savedScores);
        setAiModels(prevModels => 
          prevModels.map(model => ({
            ...model,
            score: parsedScores[model.id] || 0
          }))
        );
      } catch (error) {
        console.error('Error loading scores from localStorage:', error);
      }
    }
  }, []);

  // Save scores to localStorage whenever they change
  useEffect(() => {
    const scores = aiModels.reduce((acc, model) => {
      acc[model.id] = model.score;
      return acc;
    }, {});
    
    localStorage.setItem('aiPictionaryScores', JSON.stringify(scores));
  }, [aiModels]);

  // Stop the game and clean up when a correct answer is found or time runs out
  const stopGame = useCallback(() => {
    // Clear the analysis interval to stop API requests
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    
    // Stop the timer
    setIsTimerActive(false);
    
    // Disable drawing
    setIsDrawing(false);
    
    // Set game state to result
    setGameState('result');
    
    // Stop guessing state
    setIsGuessing(false);
  }, []);

  // Check if a guess is correct
  const checkGuessCorrect = (guess, prompt) => {
    if (!guess || !prompt) return false;
    
    // Remove any punctuation and convert to lowercase
    const normalizedGuess = guess.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const normalizedPrompt = prompt.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    
    // Split both into words
    const guessWords = normalizedGuess.split(/\s+/).filter(word => word.length > 2);
    const promptWords = normalizedPrompt.split(/\s+/).filter(word => word.length > 2);
    
    // Check for exact match
    if (normalizedGuess === normalizedPrompt) return true;
    
    // Check if the guess contains the prompt or if prompt contains the guess
    if (normalizedGuess.includes(normalizedPrompt) || normalizedPrompt.includes(normalizedGuess)) return true;
    
    // Check for word-level matches (e.g., "flower" matches "smiling flower")
    for (const promptWord of promptWords) {
      if (guessWords.includes(promptWord)) return true;
    }
    
    // Check for semantic matches (e.g., "sunflower" should match "flower")
    for (const promptWord of promptWords) {
      for (const guessWord of guessWords) {
        // Check if one word contains the other
        if (promptWord.includes(guessWord) || guessWord.includes(promptWord)) {
          // Only match if the common part is substantial (at least 3 chars)
          if (guessWord.length >= 3 && promptWord.includes(guessWord)) return true;
          if (promptWord.length >= 3 && guessWord.includes(promptWord)) return true;
        }
      }
    }
    
    // Special case for "snorkeling" which might be spelled as "snorkling"
    if (normalizedPrompt.includes("snorkel") && normalizedGuess.includes("snorkel")) return true;
    
    return false;
  };

  // Function to analyze the drawing in real-time
  const analyzeDrawing = useCallback(async () => {
    if (!canvasRef.current || !hasDrawnRef.current || hasCorrectGuess) return;
    
    try {
      const canvas = canvasRef.current.getCanvas();
      const imageData = canvas.toDataURL('image/png');
      
      const guesses = await guessDrawingWithAllModels(imageData);
      setModelGuesses(prevGuesses => ({
        ...prevGuesses,
        ...guesses
      }));
      
      // Check each model's guess against the prompt
      const correct = [];
      Object.entries(guesses).forEach(([modelId, guess]) => {
        if (checkGuessCorrect(guess, currentPrompt)) {
          correct.push(modelId);
        }
      });
      
      // Store one of the guesses for display purposes (doesn't matter which one)
      if (Object.values(guesses).length > 0) {
        setAiGuess(Object.values(guesses)[0]);
      }
      
      if (correct.length > 0) {
        // We have a correct guess!
        setCorrectModels(correct);
        setHasCorrectGuess(true);
        
        // Update scores for correct models
        setAiModels(prevModels => 
          prevModels.map(model => ({
            ...model,
            score: correct.includes(model.id) 
              ? model.score + POINTS_PER_CORRECT_GUESS 
              : model.score
          }))
        );
        
        // Stop the game immediately
        stopGame();
      }
    } catch (error) {
      console.error('Error analyzing drawing:', error);
    }
  }, [currentPrompt, hasCorrectGuess, stopGame]);

  // Start a new game with a new prompt
  const handleNewPrompt = async () => {
    // Reset state
    setIsGuessing(false);
    setAiGuess('');
    setModelGuesses({});
    setGameState('drawing');
    setCorrectModels([]);
    setHasCorrectGuess(false);
    hasDrawnRef.current = false;
    
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
    }
    
    try {
      const prompt = await generatePrompt();
      setCurrentPrompt(prompt);
      setIsDrawing(true);
      setIsTimerActive(true);
      
      // Set up interval for real-time analysis
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      
      analysisIntervalRef.current = setInterval(() => {
        if (hasDrawnRef.current && !hasCorrectGuess) {
          analyzeDrawing();
        }
      }, ANALYSIS_INTERVAL);
    } catch (error) {
      console.error('Error generating prompt:', error);
    }
  };

  // Handle when the user starts drawing
  const handleDrawingStart = () => {
    hasDrawnRef.current = true;
  };

  // Handle when the timer runs out
  const handleTimeUp = () => {
    // Only proceed if the game is still in drawing state
    if (gameState === 'drawing' && !hasCorrectGuess) {
      handleSubmitDrawing();
    }
  };

  // Submit the drawing for final analysis
  const handleSubmitDrawing = async () => {
    if (!canvasRef.current) return;
    
    // If we already have a correct guess, just stop the game
    if (hasCorrectGuess) {
      stopGame();
      return;
    }
    
    // Clear the analysis interval
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    
    setIsDrawing(false);
    setIsTimerActive(false);
    setIsGuessing(true);
    setGameState('guessing');
    
    try {
      const canvas = canvasRef.current.getCanvas();
      const imageData = canvas.toDataURL('image/png');
      
      // Final analysis with all models
      const guesses = await guessDrawingWithAllModels(imageData);
      setModelGuesses(guesses);
      
      // Store one of the guesses for display purposes (doesn't matter which one)
      if (Object.values(guesses).length > 0) {
        setAiGuess(Object.values(guesses)[0]);
      }
      
      // Check each model's guess against the prompt
      const correct = [];
      Object.entries(guesses).forEach(([modelId, guess]) => {
        console.log(`Checking ${modelId}: "${guess}" against prompt "${currentPrompt}"`);
        const isCorrect = checkGuessCorrect(guess, currentPrompt);
        console.log(`Result: ${isCorrect ? 'CORRECT' : 'incorrect'}`);
        if (isCorrect) {
          correct.push(modelId);
        }
      });
      
      setCorrectModels(correct);
      
      // Update scores for correct models
      if (correct.length > 0) {
        setHasCorrectGuess(true);
        setAiModels(prevModels => 
          prevModels.map(model => ({
            ...model,
            score: correct.includes(model.id) 
              ? model.score + POINTS_PER_CORRECT_GUESS 
              : model.score
          }))
        );
      }
      
      setGameState('result');
      setIsGuessing(false);
    } catch (error) {
      console.error('Error getting AI guess:', error);
      setAiGuess('Error: Could not analyze the drawing');
      setGameState('result');
      setIsGuessing(false);
    }
  };

  // Clear the canvas
  const handleClearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
      hasDrawnRef.current = false;
      setModelGuesses({});
      setCorrectModels([]);
      setHasCorrectGuess(false);
    }
  };

  // Reset all scores
  const handleResetScores = () => {
    setAiModels(prevModels => 
      prevModels.map(model => ({
        ...model,
        score: 0
      }))
    );
    localStorage.removeItem('aiPictionaryScores');
  };

  // Start over with a new game
  const handleStartOver = () => {
    // Clear the analysis interval
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    
    setCurrentPrompt('');
    setIsDrawing(false);
    setIsTimerActive(false);
    setAiGuess('');
    setIsGuessing(false);
    setModelGuesses({});
    setGameState('start');
    setCorrectModels([]);
    setHasCorrectGuess(false);
    hasDrawnRef.current = false;
    
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Pictionary</h1>
        <p>Draw a picture and let AI models guess what it is!</p>
      </header>
      
      <main className="App-main">
        {gameState === 'start' && (
          <div className="start-screen">
            <h2>Welcome to AI Pictionary!</h2>
            <p>Click the button below to get a prompt to draw. You'll have 1 minute to draw it!</p>
            <p>Multiple AI models will compete to guess what you're drawing in real-time.</p>
            <button className="primary-button" onClick={handleNewPrompt}>
              Get a Prompt
            </button>
            
            <div className="ranking-section">
              <AIRanking models={aiModels} />
              {aiModels.some(model => model.score > 0) && (
                <button 
                  className="reset-scores-button"
                  onClick={handleResetScores}
                >
                  Reset All Scores
                </button>
              )}
            </div>
          </div>
        )}
        
        {gameState !== 'start' && (
          <>
            <div className="game-container">
              <div className="canvas-container">
                {isDrawing && (
                  <Timer 
                    isActive={isTimerActive} 
                    duration={DRAWING_TIME_LIMIT} 
                    onTimeUp={handleTimeUp} 
                  />
                )}
                
                <DrawingCanvas 
                  ref={canvasRef} 
                  isDrawingEnabled={isDrawing}
                  onDrawingStart={handleDrawingStart}
                />
                
                <div className="canvas-controls">
                  <button onClick={handleClearCanvas} disabled={!isDrawing}>
                    Clear Canvas
                  </button>
                  {isDrawing && (
                    <button 
                      className="primary-button"
                      onClick={handleSubmitDrawing}
                    >
                      Submit Drawing
                    </button>
                  )}
                </div>
              </div>
              
              <div className="game-info">
                <PromptGenerator 
                  currentPrompt={currentPrompt} 
                  isDrawing={isDrawing}
                />
                
                <GuessDisplay 
                  aiGuess={aiGuess} 
                  isGuessing={isGuessing}
                  currentPrompt={currentPrompt}
                  gameState={gameState}
                  correctModels={correctModels}
                />
                
                <AIChat 
                  modelGuesses={modelGuesses}
                  isGuessing={isGuessing}
                  currentPrompt={currentPrompt}
                  correctModels={correctModels}
                />
                
                {gameState === 'result' && (
                  <>
                    <div className="result-actions">
                      <button 
                        className="primary-button"
                        onClick={handleStartOver}
                      >
                        Play Again
                      </button>
                    </div>
                    
                    <div className="ranking-section">
                      <AIRanking models={aiModels} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </main>
      
      <footer className="App-footer">
        <p>AI Pictionary - Draw and let AI models guess!</p>
      </footer>
    </div>
  );
}

export default App; 