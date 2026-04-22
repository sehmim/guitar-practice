import { useRef, useEffect } from 'react';

export default function FrequencyVisualizer({ analyserRef }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    let raf;
    function draw() {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) { raf = requestAnimationFrame(draw); return; }
      const ctx = canvas.getContext('2d');
      const buf = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(buf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#2C2C2C';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#FFB900';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const step = canvas.width / buf.length;
      buf.forEach((v, i) => {
        const x = i * step;
        const y = (1 - (v + 1) / 2) * canvas.height;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, [analyserRef]);
  return <canvas ref={canvasRef} width={240} height={48} className="rounded border border-[#666666] w-full max-w-xs"/>;
}
