import React from 'react';
import './AIChat.css';
import { AI_MODELS } from '../services/aiService';

const AIChat = ({ modelGuesses, isGuessing, currentPrompt, correctModels }) => {
  // Find model info by ID
  const getModelInfo = (modelId) => {
    return AI_MODELS.find(model => model.id === modelId) || {
      name: 'Unknown Model',
      color: '#999999'
    };
  };

  // Check if a model's guess is correct
  const isCorrectGuess = (modelId) => {
    return correctModels && correctModels.includes(modelId);
  };

  // Get the names of correct models
  const getCorrectModelNames = () => {
    if (!correctModels || correctModels.length === 0) return '';
    
    return correctModels.map(modelId => {
      const model = getModelInfo(modelId);
      return model.name;
    }).join(', ');
  };

  return (
    <div className="ai-chat">
      <h3>AI Models' Guesses</h3>
      
      {correctModels && correctModels.length > 0 && (
        <div className="big-success-message">
          <div className="success-icon">🎉</div>
          <h3>Correct Answer Found!</h3>
          <p>
            {correctModels.length === 1 
              ? `${getCorrectModelNames()} guessed correctly!` 
              : `${correctModels.length} models guessed correctly: ${getCorrectModelNames()}`
            }
          </p>
        </div>
      )}
      
      <div className="chat-messages">
        {isGuessing && (
          <div className="chat-loading">
            <div className="loading-spinner"></div>
            <p>AI models are analyzing your drawing...</p>
          </div>
        )}
        
        {!isGuessing && Object.keys(modelGuesses).length === 0 && (
          <p className="chat-empty">AI models will analyze your drawing in real-time as you draw.</p>
        )}
        
        {Object.entries(modelGuesses).map(([modelId, guess]) => {
          const model = getModelInfo(modelId);
          const isCorrect = isCorrectGuess(modelId);
          
          return (
            <div 
              key={modelId} 
              className={`chat-message ${isCorrect ? 'correct-guess' : ''}`}
              style={{ borderLeftColor: model.color }}
            >
              <div className="message-header" style={{ color: model.color }}>
                {model.name} {isCorrect && <span className="correct-badge">✓ Correct!</span>}
              </div>
              <div className="message-content">
                {guess}
              </div>
            </div>
          );
        })}
      </div>
      
      {!isGuessing && Object.keys(modelGuesses).length > 0 && correctModels && correctModels.length === 0 && (
        <div className="failure-message">
          <p>None of the models guessed correctly. The prompt was: <strong>{currentPrompt}</strong></p>
        </div>
      )}
    </div>
  );
};

export default AIChat; 