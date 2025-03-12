import React from 'react';
import './GuessDisplay.css';

const GuessDisplay = ({ aiGuess, isGuessing, currentPrompt, gameState, correctModels }) => {
  // Check if any model guessed correctly
  const hasCorrectGuess = correctModels && correctModels.length > 0;

  return (
    <div className="guess-display">
      <h3>AI Guesses Summary:</h3>
      
      {gameState === 'drawing' && (
        <p className="guess-waiting">Submit your drawing to see the final AI guesses!</p>
      )}
      
      {isGuessing && (
        <div className="guess-loading">
          <div className="loading-spinner"></div>
          <p>AI models are analyzing your drawing...</p>
        </div>
      )}
      
      {gameState === 'result' && (
        <div className={`guess-result ${hasCorrectGuess ? 'correct' : 'incorrect'}`}>
          {hasCorrectGuess ? (
            <div className="guess-feedback correct">
              <p>Success! {correctModels.length === 1 ? 'One model' : `${correctModels.length} models`} guessed correctly! 🎉</p>
            </div>
          ) : (
            <div className="guess-feedback incorrect">
              <p>None of the models guessed correctly.</p>
              <p>The prompt was: <strong>{currentPrompt}</strong></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GuessDisplay; 