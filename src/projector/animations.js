export function startConfetti(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#f0a500', '#ffc947', '#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#ff6b6b', '#ffd700'];
  const particles = [];
  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 10 + 5, h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 3, vy: Math.random() * 3 + 2,
      rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 10,
    });
  }
  let animId;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.rot += p.rotV; p.vy += 0.05;
      if (p.y < canvas.height + 50) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (alive) animId = requestAnimationFrame(draw);
  }
  draw();
  return () => cancelAnimationFrame(animId);
}
