import React, { useState, useEffect } from 'react';
import './Timer.css';

const Timer = ({ isActive, duration, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  
  useEffect(() => {
    // Reset timer when it becomes active again
    if (isActive) {
      setTimeLeft(duration);
    }
  }, [isActive, duration]);
  
  useEffect(() => {
    if (!isActive) {
      return;
    }
    
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isActive, timeLeft, duration, onTimeUp]);
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress percentage
  const progressPercentage = (timeLeft / duration) * 100;
  
  // Determine color based on time left
  const getColor = () => {
    if (timeLeft > duration * 0.6) return '#4caf50'; // Green
    if (timeLeft > duration * 0.3) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };
  
  return (
    <div className="timer">
      <div className="timer-display">
        <span className="timer-text" style={{ color: getColor() }}>
          {formatTime(timeLeft)}
        </span>
      </div>
      <div className="timer-progress-container">
        <div 
          className="timer-progress" 
          style={{ 
            width: `${progressPercentage}%`,
            backgroundColor: getColor()
          }}
        ></div>
      </div>
    </div>
  );
};

export default Timer; 