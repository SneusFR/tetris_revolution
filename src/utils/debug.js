// src/utils/debug.js
export const DEBUG = true; // mets false pour couper tous les logs

let lastTs = performance.now();
let tickId = 0;

export const snapPiece = (p) => {
  if (!p) return '∅';
  return `${p.name}@(${p.x},${p.y}) r${p.rotation}`;
};

export function dlog(tag, data = {}) {
  if (!DEBUG) return;
  const now = performance.now();
  const dt = (now - lastTs).toFixed(2);
  lastTs = now;
  // tag fixe sur 14 chars pour lisibilité
  const pad = (s) => (s + '              ').slice(0, 14);
  console.log(`[TETRIS] ${pad(tag)} t=${now.toFixed(1)}ms (+${dt}ms)`, data);
}

export function dgroup(title, data) {
  if (!DEBUG) return;
  console.groupCollapsed(`[TETRIS] ${title}`, data || '');
}

export function dend() {
  if (!DEBUG) return;
  console.groupEnd();
}

export function nextTick() {
  return ++tickId;
}

export function warn(tag, data = {}) {
  if (!DEBUG) return;
  console.warn(`[TETRIS] ${tag}`, data);
}
