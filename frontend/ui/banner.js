import { setText } from './i18n.js';
// Decorative motion uses CSS only: no audio access or inference dependencies.
const art = document.getElementById('banner-art');
const bars = document.getElementById('banner-bars');
const toggle = document.getElementById('banner-motion');
const label = document.getElementById('banner-motion-label');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let userPaused = false;

for (let i = 0; i < 48; i++) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('transform', `rotate(${i * 7.5} 235 140)`);
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  const length = 6 + (Math.sin(i * 1.7) + 1) * 7;
  line.setAttribute('x1', '235');
  line.setAttribute('x2', '235');
  line.setAttribute('y1', String(56 - length / 2));
  line.setAttribute('y2', String(56 + length / 2));
  line.classList.add('banner-bar');
  line.style.setProperty('--delay', `${-i * 0.19}s`);
  group.append(line);
  bars.append(group);
}

function updateMotion() {
  const paused = userPaused || reducedMotion.matches;
  art.dataset.paused = String(paused || document.hidden);
  toggle.disabled = reducedMotion.matches;
  toggle.setAttribute('aria-pressed', String(paused));
  setText(
    toggle,
    reducedMotion.matches
      ? '已依系統設定減少動態效果'
      : paused
        ? '播放 Banner 動畫'
        : '暫停 Banner 動畫',
    'aria-label'
  );
  setText(label, reducedMotion.matches ? '已減少動態' : paused ? '播放動態' : '暫停動態');
  toggle.querySelector('.motion-symbol').textContent = paused ? '▷' : 'Ⅱ';
}
toggle.addEventListener('click', () => {
  userPaused = !userPaused;
  updateMotion();
});
reducedMotion.addEventListener('change', updateMotion);
document.addEventListener('visibilitychange', updateMotion);
updateMotion();
toggle.hidden = false;
