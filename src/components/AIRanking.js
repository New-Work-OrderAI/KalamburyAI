import React from 'react';
import './AIRanking.css';

const AIRanking = ({ models }) => {
  // Sort models by score in descending order
  const sortedModels = [...models].sort((a, b) => b.score - a.score);

  return (
    <div className="ai-ranking">
      <h3>AI Models Ranking</h3>
      
      <div className="ranking-container">
        {sortedModels.length === 0 ? (
          <p className="ranking-empty">No scores yet. Play a few rounds to see which AI is the best!</p>
        ) : (
          <table className="ranking-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Model</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {sortedModels.map((model, index) => (
                <tr key={model.id} className={index === 0 ? 'first-place' : ''}>
                  <td>{index + 1}</td>
                  <td>
                    <span className="model-name" style={{ color: model.color }}>
                      {model.name}
                    </span>
                  </td>
                  <td>{model.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AIRanking; 