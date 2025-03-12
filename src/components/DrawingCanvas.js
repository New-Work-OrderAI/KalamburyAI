import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import './DrawingCanvas.css';

const DrawingCanvas = forwardRef(({ isDrawingEnabled, onDrawingStart }, ref) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    canvas.style.width = `${canvas.offsetWidth}px`;
    canvas.style.height = `${canvas.offsetHeight}px`;

    // Set up canvas context
    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.lineCap = 'round';
    context.strokeStyle = 'black';
    context.lineWidth = 5;
    contextRef.current = context;

    // Clear canvas initially
    clearCanvas();
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  useImperativeHandle(ref, () => ({
    clearCanvas,
    getCanvas: () => canvasRef.current
  }));

  const startDrawing = ({ nativeEvent }) => {
    if (!isDrawingEnabled) return;
    
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    isDrawingRef.current = true;
    
    // Notify parent component that drawing has started
    if (onDrawingStart) {
      onDrawingStart();
    }
  };

  const finishDrawing = () => {
    if (!isDrawingEnabled) return;
    
    contextRef.current.closePath();
    isDrawingRef.current = false;
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawingRef.current || !isDrawingEnabled) return;
    
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  // Handle touch events
  const handleTouchStart = (e) => {
    if (!isDrawingEnabled) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left;
    const offsetY = touch.clientY - rect.top;
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    isDrawingRef.current = true;
    
    // Notify parent component that drawing has started
    if (onDrawingStart) {
      onDrawingStart();
    }
  };

  const handleTouchMove = (e) => {
    if (!isDrawingRef.current || !isDrawingEnabled) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left;
    const offsetY = touch.clientY - rect.top;
    
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const handleTouchEnd = (e) => {
    if (!isDrawingEnabled) return;
    
    e.preventDefault();
    contextRef.current.closePath();
    isDrawingRef.current = false;
  };

  return (
    <div className="drawing-canvas-container">
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseOut={finishDrawing}
        onMouseMove={draw}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      {!isDrawingEnabled && (
        <div className="canvas-overlay">
          <p>Drawing is disabled</p>
        </div>
      )}
    </div>
  );
});

export default DrawingCanvas; 