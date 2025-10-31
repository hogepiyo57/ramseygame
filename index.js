const cvs = document.getElementById("game");
const ctx = cvs.getContext("2d");
const R = 200;
const center = {x: 250, y: 250};
const n = 6;
const points = [];
const edges = {};
const history = [];
let currentColor = "red";
let gameOver = false;
let winEdges = [];
let selected = [];
const turnLabel = document.getElementById("turn");

// === 音設定 ===
let audioCtx = null;
function ensureAudioCtx() {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
}
function playClick(color) {
  ensureAudioCtx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = "square";
  osc.frequency.value = color === "red" ? 520 : 360;
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

// === 頂点配置 ===
for (let i = 0; i < n; i++) {
  const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
  points.push({
    x: center.x + R * Math.cos(angle),
    y: center.y + R * Math.sin(angle)
  });
}

function drawPoints() {
  ctx.clearRect(0, 0, cvs.width, cvs.height);

  for (let key in edges) {
    const e = edges[key];
    const highlight = winEdges.some(w => w.a === e.a && w.b === e.b && w.color === e.color);
    ctx.strokeStyle = highlight ? "gold" : e.color;
    ctx.lineWidth = highlight ? 5 : 2;
    ctx.beginPath();
    ctx.moveTo(points[e.a].x, points[e.a].y);
    ctx.lineTo(points[e.b].x, points[e.b].y);
    ctx.stroke();
  }

  ctx.fillStyle = "black";
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
    ctx.fill();
  }
}

// === 入力処理 ===
cvs.addEventListener("click", e => {
  if (gameOver) return;
  if (selected.length >= 2) selected = [];

  const rect = cvs.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  // 点クリック検出
  let hitIndex = -1;
  for (let i = 0; i < n; i++) {
    const dx = mx - points[i].x;
    const dy = my - points[i].y;
    if (Math.sqrt(dx * dx + dy * dy) < 10) {
      hitIndex = i;
      break;
    }
  }
  if (hitIndex === -1) return; // 空白クリック無視

  playClick(currentColor);
  selected.push(hitIndex);

  if (selected.length === 2) {
    let [a, b] = selected;
    if (a === b) { selected = []; return; }
    if (a > b) [a, b] = [b, a];
    const key = `${a}-${b}`;
    if (!edges[key]) {
      edges[key] = { a, b, color: currentColor };
      history.push(key);

      const triangle = checkTriangle(currentColor);
      if (triangle) {
        winEdges = triangle.map(([i, j]) => ({ a: i, b: j, color: currentColor }));
        drawPoints();
        gameOver = true;
        selected = [];
        setTimeout(() => {
          alert(`${currentColor === "red" ? "赤" : "青"}の勝ち！`);
          reset();
        }, 100);
        return;
      }
      currentColor = currentColor === "red" ? "blue" : "red";
      turnLabel.textContent = currentColor === "red" ? "赤の番" : "青の番";
    }
    selected = [];
  }
  drawPoints();
});

function checkTriangle(color) {
  const colorEdges = Object.values(edges).filter(e => e.color === color);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        if (
          hasEdge(colorEdges, i, j) &&
          hasEdge(colorEdges, j, k) &&
          hasEdge(colorEdges, i, k)
        ) return [[i, j], [j, k], [i, k]];
      }
    }
  }
  return null;
}

function hasEdge(list, a, b) {
  return list.some(e => (e.a === a && e.b === b) || (e.a === b && e.b === a));
}

function reset() {
  ensureAudioCtx();
  for (let k in edges) delete edges[k];
  history.length = 0;
  winEdges = [];
  currentColor = "red";
  gameOver = false;
  selected = [];
  turnLabel.textContent = "赤の番";
  setTimeout(drawPoints, 0);
}

function undo() {
  if (history.length === 0 || gameOver) return;
  const lastKey = history.pop();
  delete edges[lastKey];
  currentColor = currentColor === "red" ? "blue" : "red";
  turnLabel.textContent = currentColor === "red" ? "赤の番" : "青の番";
  selected = [];
  drawPoints();
}

document.getElementById("resetBtn").addEventListener("click", reset);
document.getElementById("undoBtn").addEventListener("click", undo);

drawPoints();


