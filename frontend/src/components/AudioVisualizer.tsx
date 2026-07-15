import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isRecording: boolean;
  isPaused: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, isRecording, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bufferLength = analyser ? analyser.frequencyBinCount : 0;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationId = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;

      // Draw background
      ctx.clearRect(0, 0, width, height);

      // If not recording, draw a flat pulsing line
      if (!isRecording || !analyser || isPaused) {
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        
        // Draw flat line with subtle static noise (or flat pulse)
        const time = Date.now() * 0.003;
        for (let i = 0; i < width; i++) {
          const y = height / 2 + (isRecording && isPaused ? 0 : Math.sin(i * 0.05 + time) * 1.5);
          ctx.lineTo(i, y);
        }
        
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)'; // Dim Indigo
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }

      // Read audio data
      analyser.getByteFrequencyData(dataArray);

      // We want to draw multiple overlapping waves for a premium "Siri/Alexa-like" look
      ctx.lineWidth = 2;
      
      // Define wave details (3 overlapping paths with different colors and phases)
      const waves = [
        { color: 'rgba(99, 102, 241, 0.7)', speed: 0.1, amplitude: 0.8, phase: 0 },   // Indigo
        { color: 'rgba(124, 58, 237, 0.6)', speed: 0.15, amplitude: 0.6, phase: 2 },  // Violet
        { color: 'rgba(6, 182, 212, 0.8)', speed: 0.08, amplitude: 0.4, phase: 4 }   // Cyan
      ];

      const time = Date.now() * 0.005;

      // Calculate average volume/amplitude from dataArray
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avgVolume = sum / bufferLength;
      // Normalize volume multiplier (0.5 to 3.0 based on loudness)
      const volumeMultiplier = Math.max(0.2, (avgVolume / 128.0) * 1.5);

      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.moveTo(0, height / 2);

        for (let x = 0; x < width; x++) {
          // Calculate wave height at point x
          const angle = (x / width) * Math.PI * 2 * 1.5 + wave.phase + time * wave.speed;
          
          // Modulate height by average audio volume
          const offset = Math.sin(angle) * (height * 0.25) * wave.amplitude * volumeMultiplier;
          
          // Fade out the edges (left and right ends of the line remain at height/2)
          const edgeFilter = Math.sin((x / width) * Math.PI);
          const y = height / 2 + offset * edgeFilter;

          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = wave.color;
        ctx.stroke();
      });
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser, isRecording, isPaused]);

  return (
    <div className="relative w-full h-24 rounded-2xl overflow-hidden bg-slate-950/20 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        width={500} 
        height={96} 
        className="w-full h-full block"
      />
      {isRecording && !isPaused && (
        <span className="absolute top-3 right-4 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      )}
    </div>
  );
};
