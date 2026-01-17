import React, { useEffect, useRef } from 'react';

const DataStreamBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width, height;
    const streams = [];

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    class DataStream {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.speed = 1 + Math.random() * 2;
        this.length = 10 + Math.random() * 20;
        this.opacity = 0.1 + Math.random() * 0.3;
      }

      update() {
        this.y += this.speed;
        if (this.y > height) {
          this.y = -this.length;
          this.x = Math.random() * width;
        }
      }

      draw() {
        // Gradient Trail
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y - this.length);
        // Emerald colors for data packets
        gradient.addColorStop(0, `rgba(16, 185, 129, 0)`);
        gradient.addColorStop(1, `rgba(52, 211, 153, ${this.opacity})`);

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y - this.length);
        ctx.stroke();
      }
    }

    const init = () => {
      resize();
      // Create streams
      const density = window.innerWidth / 15; // Responsive density
      for (let i = 0; i < density; i++) {
        streams.push(new DataStream());
      }
      animate();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      streams.forEach(s => {
        s.update();
        s.draw();
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
      className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40 dark:opacity-30"
    />
  );
};

export default DataStreamBackground;