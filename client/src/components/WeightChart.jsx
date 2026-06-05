import { useRef, useEffect } from 'react';

export default function WeightChart({ weightEntries }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!weightEntries || weightEntries.length < 2) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const PAD = { top: 20, right: 20, bottom: 30, left: 45 };
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;

    const weights = weightEntries.map(e => e.weight_kg);
    const minW = Math.floor(Math.min(...weights) - 1);
    const maxW = Math.ceil(Math.max(...weights) + 1);

    const xScale = (i) => PAD.left + (i / (weightEntries.length - 1)) * plotW;
    const yScale = (w) => PAD.top + plotH - ((w - minW) / (maxW - minW)) * plotH;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const w = minW + ((maxW - minW) / steps) * i;
      const y = yScale(w);
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(W - PAD.right, y);
      ctx.stroke();

      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${w.toFixed(1)}`, PAD.left - 5, y + 4);
    }

    // Line
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    weightEntries.forEach((e, i) => {
      const x = xScale(i);
      const y = yScale(e.weight_kg);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Shadow/gradient for area under line
    const gradient = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + plotH);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(weightEntries[0].weight_kg));
    weightEntries.forEach((e, i) => {
      ctx.lineTo(xScale(i), yScale(e.weight_kg));
    });
    ctx.lineTo(xScale(weightEntries.length - 1), PAD.top + plotH);
    ctx.lineTo(xScale(0), PAD.top + plotH);
    ctx.closePath();
    ctx.fill();

    // Points with glow
    weightEntries.forEach((e, i) => {
      const x = xScale(i);
      const y = yScale(e.weight_kg);

      // Glow
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.fill();

      // Main dot
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#6366f1';
      ctx.fill();

      // Border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // X-axis labels (show a few)
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    const labelStep = Math.max(1, Math.floor(weightEntries.length / 8));
    weightEntries.forEach((e, i) => {
      if (i % labelStep === 0 || i === weightEntries.length - 1) {
        const x = xScale(i);
        const label = `D${e.day_index + 1}`;
        ctx.fillText(label, x, H - 5);
      }
    });
  }, [weightEntries]);

  if (!weightEntries || weightEntries.length < 2) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <span>📈</span> Weight Trend
        </h2>
        <p className="text-sm text-gray-500">Log weight on at least 2 days to see the chart.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-8 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>📈</span> Weight Trend
      </h2>
      <canvas ref={canvasRef} className="w-full" style={{ height: 250 }} />
    </div>
  );
}
