import React from 'react';
import './PromptGenerator.css';

const PromptGenerator = ({ currentPrompt, isDrawing }) => {
  return (
    <div className="prompt-generator">
      <h3>Your Drawing Prompt:</h3>
      {currentPrompt ? (
        <div className="prompt-display">
          <p className="prompt-text">{currentPrompt}</p>
          {isDrawing && (
            <p className="prompt-instruction">Draw this on the canvas!</p>
          )}
        </div>
      ) : (
        <div className="prompt-loading">
          <div className="loading-spinner"></div>
          <p>Generating prompt...</p>
        </div>
      )}
    </div>
  );
};

export default PromptGenerator; 