import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const BannerDisplay = ({ banner, className = '' }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!banner || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let particles = [];
    let tetrisPieces = [];
    let matrixChars = [];
    let waveOffset = 0;
    let time = 0;

    // Initialisation selon le type de bannière
    const initBanner = () => {
      particles = [];
      tetrisPieces = [];
      matrixChars = [];

      switch (banner.type) {
        case 'particles':
          for (let i = 0; i < banner.config.particleCount; i++) {
            particles.push({
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              size: Math.random() * 3 + 1,
              opacity: Math.random() * 0.8 + 0.2
            });
          }
          break;

        case 'tetris':
          const pieceShapes = {
            I: [[1,1,1,1]],
            O: [[1,1],[1,1]],
            T: [[0,1,0],[1,1,1]],
            S: [[0,1,1],[1,1,0]],
            Z: [[1,1,0],[0,1,1]],
            J: [[1,0,0],[1,1,1]],
            L: [[0,0,1],[1,1,1]]
          };

          for (let i = 0; i < 8; i++) {
            const pieceType = banner.config.pieces[Math.floor(Math.random() * banner.config.pieces.length)];
            tetrisPieces.push({
              x: Math.random() * canvas.width,
              y: -50,
              shape: pieceShapes[pieceType],
              type: pieceType,
              speed: Math.random() * 2 + 1,
              rotation: 0,
              rotationSpeed: (Math.random() - 0.5) * 0.1
            });
          }
          break;

        case 'matrix':
          const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          for (let i = 0; i < 20; i++) {
            matrixChars.push({
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              char: chars[Math.floor(Math.random() * chars.length)],
              speed: Math.random() * 3 + 1,
              opacity: Math.random() * 0.8 + 0.2
            });
          }
          break;
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016;

      switch (banner.type) {
        case 'gradient':
          // Pas d'animation nécessaire, le CSS gère le gradient
          break;

        case 'particles':
          particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

            ctx.globalAlpha = particle.opacity;
            ctx.fillStyle = banner.config.particleColor;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
          });
          break;

        case 'tetris':
          const colors = ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff8800', '#ff0044', '#8800ff'];
          
          tetrisPieces.forEach((piece, index) => {
            piece.y += piece.speed;
            piece.rotation += piece.rotationSpeed;

            if (piece.y > canvas.height + 50) {
              piece.y = -50;
              piece.x = Math.random() * canvas.width;
            }

            ctx.save();
            ctx.translate(piece.x, piece.y);
            ctx.rotate(piece.rotation);
            
            const blockSize = 15;
            ctx.fillStyle = colors[index % colors.length];
            
            piece.shape.forEach((row, rowIndex) => {
              row.forEach((cell, colIndex) => {
                if (cell) {
                  ctx.fillRect(
                    colIndex * blockSize - (row.length * blockSize) / 2,
                    rowIndex * blockSize - (piece.shape.length * blockSize) / 2,
                    blockSize - 1,
                    blockSize - 1
                  );
                }
              });
            });
            
            ctx.restore();
          });
          break;

        case 'grid':
          const gridSize = 30;
          ctx.strokeStyle = banner.config.gridColor;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.3 + Math.sin(time * 2) * 0.2;

          for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }

          for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }
          break;

        case 'wave':
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
          banner.config.waveColors.forEach((color, index) => {
            gradient.addColorStop(index / (banner.config.waveColors.length - 1), color);
          });

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);

          for (let x = 0; x <= canvas.width; x += 5) {
            const y = canvas.height / 2 + Math.sin((x + waveOffset) * 0.02) * 30;
            ctx.lineTo(x, y);
          }

          ctx.lineTo(canvas.width, canvas.height);
          ctx.lineTo(0, canvas.height);
          ctx.closePath();
          ctx.fill();

          waveOffset += 2;
          break;

        case 'matrix':
          ctx.font = '14px monospace';
          ctx.fillStyle = banner.config.textColor;

          matrixChars.forEach(char => {
            char.y += char.speed;
            if (char.y > canvas.height) {
              char.y = -20;
              char.x = Math.random() * canvas.width;
              char.char = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 36)];
            }

            ctx.globalAlpha = char.opacity;
            ctx.fillText(char.char, char.x, char.y);
          });
          break;

        case 'fire':
          for (let i = 0; i < 30; i++) {
            const x = Math.random() * canvas.width;
            const y = canvas.height - Math.random() * 100;
            const size = Math.random() * 20 + 5;
            
            const colorIndex = Math.floor(Math.random() * banner.config.flameColors.length);
            ctx.fillStyle = banner.config.flameColors[colorIndex];
            ctx.globalAlpha = Math.random() * 0.8 + 0.2;
            
            ctx.beginPath();
            ctx.arc(x, y - Math.sin(time * 5 + x * 0.01) * 20, size, 0, Math.PI * 2);
            ctx.fill();
          }
          break;

        case 'circuit':
          ctx.strokeStyle = banner.config.circuitColor;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.6 + Math.sin(time * 3) * 0.3;

          // Lignes de circuit horizontales
          for (let y = 20; y < canvas.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();

            // Nœuds de circuit
            for (let x = 30; x < canvas.width; x += 60) {
              ctx.beginPath();
              ctx.arc(x, y, 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // Lignes verticales
          for (let x = 30; x < canvas.width; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
          break;
      }

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    initBanner();
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [banner]);

  if (!banner || !banner.config) return null;

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ background: banner.config?.background || banner.config?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      {banner.type !== 'gradient' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ mixBlendMode: banner.type === 'fire' ? 'screen' : 'normal' }}
        />
      )}
    </div>
  );
};

export default BannerDisplay;
