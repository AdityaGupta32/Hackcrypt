import React, { useEffect, useRef } from 'react';

const TradingBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width, height;
    const candles = [];

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    class Candle {
      constructor() {
        this.x = Math.random() * width;
        this.y = height + Math.random() * 100;
        this.speed = 0.5 + Math.random();
        this.height = 20 + Math.random() * 50;
        this.width = 4 + Math.random() * 4;
        this.isGreen = Math.random() > 0.4; // More green than red
        this.opacity = 0.1 + Math.random() * 0.2;
      }

      update() {
        this.y -= this.speed;
        if (this.y + this.height < 0) {
          this.y = height + Math.random() * 100;
          this.x = Math.random() * width;
        }
      }

      draw() {
        ctx.fillStyle = this.isGreen 
          ? `rgba(16, 185, 129, ${this.opacity})` // Emerald
          : `rgba(239, 68, 68, ${this.opacity})`; // Red
        
        // Main candle body
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Wick
        ctx.fillRect(this.x + this.width / 2 - 0.5, this.y - 10, 1, this.height + 20);
      }
    }

    const init = () => {
      resize();
      for (let i = 0; i < 50; i++) {
        candles.push(new Candle());
      }
      animate();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      candles.forEach(candle => {
        candle.update();
        candle.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    init();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-30 dark:opacity-20"
    />
  );
};

export default TradingBackground;