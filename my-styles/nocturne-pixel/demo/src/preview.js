// Browser preview (index.html?preview=1): play / pause / restart / mute / low-res / full-res / export.
// Never part of the exported film: the render tools load index.html without ?preview.
export function start(render, DUR) {
  const cv = document.getElementById('c');
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;display:flex;gap:6px;align-items:center;padding:8px;background:rgba(5,8,15,.85);font:13px system-ui;color:#FFE7BB;z-index:9';
  const btn = (label, fn) => { const b = document.createElement('button'); b.textContent = label; b.onclick = fn; b.style.cssText = 'background:#182945;color:#FFE7BB;border:1px solid #40546B;padding:5px 9px;cursor:pointer'; bar.appendChild(b); return b; };
  const audio = new Audio('output/mix.wav'); audio.preload = 'auto';
  let playing = false, t0 = 0, base = 0, tNow = 0;
  const clock = document.createElement('span'); clock.style.marginLeft = 'auto';
  const scrub = document.createElement('input'); scrub.type = 'range'; scrub.min = 0; scrub.max = DUR; scrub.step = 1 / 30; scrub.style.flex = '1';
  const tick = () => { if (playing) { tNow = audio.readyState > 2 && !audio.paused ? audio.currentTime : base + (performance.now() - t0) / 1000; if (tNow >= DUR) { tNow = 0; seek(0); } }
    render(tNow); scrub.value = tNow; clock.textContent = tNow.toFixed(2) + ' / ' + DUR + ' s'; requestAnimationFrame(tick); };
  const seek = s => { base = tNow = s; t0 = performance.now(); audio.currentTime = s; };
  btn('Play', () => { playing = true; seek(tNow); audio.play().catch(() => {}); });
  btn('Pause', () => { playing = false; audio.pause(); });
  btn('Restart', () => { seek(0); });
  const mute = btn('Mute', () => { audio.muted = !audio.muted; mute.textContent = audio.muted ? 'Unmute' : 'Mute'; });
  btn('Preview ½', () => { cv.style.height = '50vh'; });
  btn('Full res', () => { cv.style.height = '100vh'; });
  btn('Export MP4', () => alert('The MP4 is rendered offline, frame by frame, for exact timing:\n\n  sh films/the-last-window/build.sh\n\nIt writes output/the_last_window_40s.mp4 (1080x1920, 30 fps, H.264 + AAC 48 kHz).'));
  bar.appendChild(scrub); bar.appendChild(clock);
  scrub.oninput = () => seek(+scrub.value);
  document.body.appendChild(bar); requestAnimationFrame(tick);
}
