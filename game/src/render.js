// Starfall Shepherd — everything the eye sees. Canvas 2D only, no images:
// the night sky, the dawn that approaches wave by wave, the lantern-spirit,
// the falling seeds and shards, and every screen from title to victory.
export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

function lerp(a, b, t) {
  return a + (b - a) * t;
}
function mix(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}
function css(c, a = 1) {
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
}

const SKY_TOP_NIGHT = [9, 13, 38];
const SKY_TOP_DAWN = [58, 44, 96];
const SKY_BOT_NIGHT = [24, 36, 78];
const SKY_BOT_DAWN = [232, 145, 90];

function drawStarShape(ctx, x, y, r, rot) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = rot + (i * Math.PI) / 4;
    const rr = i % 2 === 0 ? r : r * 0.42;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawShardShape(ctx, x, y, r, rot) {
  ctx.beginPath();
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = rot + (i * Math.PI * 2) / n;
    const rr = r * (i % 2 === 0 ? 1 : 0.55);
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawHeart(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.3, y, x - s * 0.7, y - s, x, y - s * 0.25);
  ctx.bezierCurveTo(x + s * 0.7, y - s, x + s * 1.3, y, x, y + s * 0.9);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
  }

  function drawSky(s, dawn) {
    const g = ctx.createLinearGradient(0, 0, 0, s.h);
    g.addColorStop(0, css(mix(SKY_TOP_NIGHT, SKY_TOP_DAWN, dawn)));
    g.addColorStop(0.65, css(mix(SKY_BOT_NIGHT, SKY_BOT_DAWN, dawn * 0.85)));
    g.addColorStop(1, css(mix([16, 22, 48], [120, 70, 90], dawn)));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s.w, s.h);

    // Twinkling stars, fading as dawn comes.
    for (const st of s.stars) {
      const a = (0.35 + 0.65 * Math.abs(Math.sin(s.time * st.speed + st.phase))) * (1 - dawn * 0.75);
      ctx.fillStyle = `rgba(255,244,200,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // The moon sets as the sun climbs the horizon.
    const moonX = s.w * 0.82;
    const moonY = s.h * 0.16 + dawn * s.h * 0.3;
    const sunY = s.h * 0.86 - dawn * s.h * 0.55;
    const sunGlow = ctx.createRadialGradient(s.w * 0.5, sunY, 4, s.w * 0.5, sunY, 190);
    sunGlow.addColorStop(0, `rgba(255,190,110,${0.25 + dawn * 0.55})`);
    sunGlow.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, s.w, s.h);
    ctx.fillStyle = `rgba(255,214,140,${0.5 + dawn * 0.5})`;
    ctx.beginPath();
    ctx.arc(s.w * 0.5, sunY, 26 + dawn * 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(240,238,255,${(1 - dawn * 0.8).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(200,200,225,${(0.5 * (1 - dawn * 0.8)).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(moonX - 7, moonY - 5, 5, 0, Math.PI * 2);
    ctx.arc(moonX + 8, moonY + 7, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Two ridges of sleeping hills.
    ctx.fillStyle = css(mix([13, 18, 42], [74, 52, 84], dawn));
    ctx.beginPath();
    ctx.moveTo(0, s.h);
    for (let x = 0; x <= s.w; x += 16) {
      ctx.lineTo(x, s.h * 0.86 - Math.sin(x * 0.006 + 1.2) * 18 - Math.sin(x * 0.013) * 8);
    }
    ctx.lineTo(s.w, s.h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = css(mix([8, 12, 30], [52, 38, 66], dawn));
    ctx.beginPath();
    ctx.moveTo(0, s.h);
    for (let x = 0; x <= s.w; x += 16) {
      ctx.lineTo(x, s.h * 0.93 - Math.sin(x * 0.009 + 4) * 12);
    }
    ctx.lineTo(s.w, s.h);
    ctx.closePath();
    ctx.fill();
    // Ground line, warm where the light lands.
    ctx.fillStyle = css(mix([20, 26, 54], [146, 96, 92], dawn));
    ctx.fillRect(0, s.h - 46, s.w, 46);
    ctx.fillStyle = `rgba(255,215,106,${0.25 + dawn * 0.4})`;
    ctx.fillRect(0, s.h - 46, s.w, 2);
  }

  function drawEntity(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.kind === 'seed') {
      ctx.shadowColor = '#ffd76a';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#ffd76a';
      drawStarShape(ctx, 0, 0, e.r + 2, e.rot);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff6d8';
      drawStarShape(ctx, 0, 0, e.r * 0.45, e.rot);
      ctx.fill();
    } else if (e.kind === 'shard') {
      ctx.shadowColor = '#a64dff';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#2a1445';
      drawShardShape(ctx, 0, 0, e.r + 2, e.rot);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#c77dff';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = '#e0aaff';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Power-up orb with a drawn glyph, never an emoji.
      const colors = { shield: '#7dd8ff', magnet: '#ff8fd0', slow: '#8fd0ff', heart: '#ff6b81' };
      const c = colors[e.power] || '#fff';
      ctx.shadowColor = c;
      ctx.shadowBlur = 14;
      ctx.fillStyle = 'rgba(10,14,34,0.85)';
      ctx.beginPath();
      ctx.arc(0, 0, e.r + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = c;
      ctx.strokeStyle = c;
      if (e.power === 'shield') {
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(7, -5);
        ctx.lineTo(7, 1);
        ctx.quadraticCurveTo(7, 7, 0, 9);
        ctx.quadraticCurveTo(-7, 7, -7, 1);
        ctx.lineTo(-7, -5);
        ctx.closePath();
        ctx.fill();
      } else if (e.power === 'magnet') {
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, -1, 6.5, Math.PI, 0);
        ctx.moveTo(-6.5, -1);
        ctx.lineTo(-6.5, 5);
        ctx.moveTo(6.5, -1);
        ctx.lineTo(6.5, 5);
        ctx.stroke();
      } else if (e.power === 'slow') {
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -5);
        ctx.moveTo(0, 0);
        ctx.lineTo(4, 2);
        ctx.stroke();
      } else {
        drawHeart(ctx, 0, -1, 6.5);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawPlayer(s) {
    const p = s.player;
    if (p.invuln > 0 && Math.floor(s.time * 14) % 2 === 0) return; // blink while hurt
    const flap = Math.sin(s.time * 10) * 0.5;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (s.shake > 0) ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
    // Glow.
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 64);
    glow.addColorStop(0, 'rgba(255,215,106,0.55)');
    glow.addColorStop(1, 'rgba(255,215,106,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 64, 0, Math.PI * 2);
    ctx.fill();
    // Wings.
    ctx.fillStyle = 'rgba(255,236,180,0.9)';
    ctx.save();
    ctx.rotate(-0.5 - flap * 0.35);
    ctx.beginPath();
    ctx.ellipse(-20, -6, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.rotate(0.5 + flap * 0.35);
    ctx.beginPath();
    ctx.ellipse(20, -6, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Lantern body.
    const body = ctx.createRadialGradient(-4, -6, 2, 0, 0, p.r + 4);
    body.addColorStop(0, '#fff3c4');
    body.addColorStop(0.55, '#ffd76a');
    body.addColorStop(1, '#e89b3c');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,70,10,0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Flame core + eyes.
    ctx.fillStyle = '#fff8e0';
    ctx.beginPath();
    ctx.ellipse(0, 2, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2408';
    ctx.beginPath();
    ctx.arc(-6, -4, 2.2, 0, Math.PI * 2);
    ctx.arc(6, -4, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Status rings.
    if (p.shield) {
      ctx.strokeStyle = 'rgba(125,216,255,0.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, p.r + 9, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (p.magnet > 0) {
      ctx.strokeStyle = 'rgba(255,143,208,0.55)';
      ctx.setLineDash([6, 8]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.r + 16, s.time * 2, s.time * 2 + Math.PI * 1.5);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawHud(s, best, muted) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    // Score block.
    ctx.fillStyle = 'rgba(8,12,30,0.55)';
    roundRect(12, 12, 218, 64, 10);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '700 26px system-ui, sans-serif';
    ctx.fillText(`SCORE  ${s.score}`, 24, 20);
    ctx.fillStyle = '#cdd6f4';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`BEST  ${Math.max(best, s.score)}`, 24, 52);
    if (s.mult > 1) {
      ctx.fillStyle = '#ffd76a';
      ctx.font = '700 20px system-ui, sans-serif';
      ctx.fillText(`COMBO ×${s.mult}`, 24, 74);
      ctx.fillStyle = 'rgba(255,215,106,0.35)';
      ctx.fillRect(24, 98, 90 * (s.comboTimer / 2.5), 4);
    }
    // Wave progress, top centre.
    const bw = 260;
    const bx = (s.w - bw) / 2;
    ctx.fillStyle = 'rgba(8,12,30,0.55)';
    roundRect(bx - 10, 12, bw + 20, 52, 10);
    ctx.fill();
    ctx.fillStyle = '#e8ecff';
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${Math.min(s.wave, 8)} / 8`, s.w / 2, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    roundRect(bx, 44, bw, 8, 4);
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    roundRect(bx, 44, bw * (s.seedsCaught / s.needed), 8, 4);
    ctx.fill();
    ctx.fillStyle = '#cdd6f4';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(`${s.seedsCaught} / ${s.needed} seeds`, s.w / 2, 56);
    // Lives + mute, top right.
    ctx.textAlign = 'right';
    for (let i = 0; i < Math.max(s.lives, 0); i++) {
      drawHeart(ctx, s.w - 30 - i * 30, 34, 9);
      ctx.fillStyle = '#ff6b81';
      ctx.fill();
    }
    ctx.fillStyle = '#cdd6f4';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(muted ? 'M — sound off' : 'M — mute · P — pause', s.w - 16, 56);
    // Pulse cooldown, bottom centre.
    const ready = s.pulseCooldown <= 0;
    ctx.textAlign = 'center';
    ctx.fillStyle = ready ? '#9fe8ff' : 'rgba(205,214,244,0.55)';
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillText(
      ready ? 'SPACE / CLICK — PULSE READY' : `PULSE … ${s.pulseCooldown.toFixed(1)}s`,
      s.w / 2,
      s.h - 34,
    );
    if (!ready) {
      ctx.fillStyle = 'rgba(159,232,255,0.4)';
      ctx.fillRect(s.w / 2 - 50, s.h - 18, 100 * (1 - s.pulseCooldown / 1.2), 3);
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function overlay(title, lines, accent) {
    ctx.fillStyle = 'rgba(6,9,24,0.62)';
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;
    ctx.fillStyle = accent;
    ctx.font = '700 54px Georgia, serif';
    ctx.fillText(title, cx, cy - 96);
    ctx.fillStyle = '#e8ecff';
    ctx.font = '17px system-ui, sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, cx, cy - 44 + i * 30));
  }

  return {
    resize,
    draw(s, screen, best, muted) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const dawn = Math.min(1, (s.wave - 1) / 8 + (s.seedsCaught / s.needed) / 8);
      ctx.save();
      if (s.shake > 0) ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
      drawSky(s, dawn);
      for (const e of s.entities) drawEntity(e);
      if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawPlayer(s);
      // Particles.
      for (const pt of s.particles) {
        const a = Math.max(0, pt.life / pt.maxLife);
        if (pt.ring) {
          ctx.strokeStyle = `rgba(159,232,255,${a})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size * (1 - a) + 24, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = pt.color;
          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size * a + 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      // Floating score popups.
      ctx.textAlign = 'center';
      for (const pp of s.popups) {
        ctx.globalAlpha = Math.max(0, pp.life / pp.maxLife);
        ctx.fillStyle = pp.color;
        ctx.font = `700 ${pp.size}px system-ui, sans-serif`;
        ctx.fillText(pp.text, pp.x, pp.y);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      // Hit flash.
      if (s.flash > 0) {
        ctx.fillStyle = `rgba(255,60,90,${(s.flash * 0.45).toFixed(3)})`;
        ctx.fillRect(0, 0, w, h);
      }
      if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(s, best, muted);
      if (s.banner && (screen === SCREEN_PLAY || screen === SCREEN_PAUSED)) {
        ctx.textAlign = 'center';
        ctx.globalAlpha = Math.min(1, s.banner.timer);
        ctx.fillStyle = '#ffe9a8';
        ctx.font = '700 44px Georgia, serif';
        ctx.fillText(s.banner.text, w / 2, h * 0.3);
        ctx.fillStyle = '#e8ecff';
        ctx.font = '16px system-ui, sans-serif';
        ctx.fillText(s.banner.sub, w / 2, h * 0.3 + 36);
        ctx.globalAlpha = 1;
      }
      if (screen === SCREEN_TITLE) {
        overlay('STARFALL SHEPHERD', [], '#ffd76a');
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e8ecff';
        ctx.font = '17px system-ui, sans-serif';
        const cx = w / 2;
        const cy = h / 2;
        ctx.fillText('The night is falling apart. Guide the last lantern,', cx, cy - 8);
        ctx.fillText('gather the star-seeds before they fade, and dodge the void shards.', cx, cy + 20);
        ctx.fillText('Clear all 8 waves and bring back the dawn.', cx, cy + 48);
        ctx.fillStyle = '#ffd76a';
        ctx.font = '700 19px system-ui, sans-serif';
        ctx.fillText('WASD / ARROWS or MOUSE to fly  ·  SPACE / CLICK to pulse', cx, cy + 96);
        ctx.fillStyle = '#9fe8ff';
        ctx.font = '15px system-ui, sans-serif';
        ctx.fillText('Pulse gathers nearby seeds and knocks shards away  ·  P pauses  ·  M mutes', cx, cy + 124);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 22px system-ui, sans-serif';
        const pulse = 0.6 + 0.4 * Math.sin(s.time * 4);
        ctx.globalAlpha = pulse;
        ctx.fillText('PRESS SPACE OR CLICK TO BEGIN', cx, cy + 172);
        ctx.globalAlpha = 1;
        if (best > 0) {
          ctx.fillStyle = '#cdd6f4';
          ctx.font = '15px system-ui, sans-serif';
          ctx.fillText(`Best score: ${best}`, cx, cy + 204);
        }
      } else if (screen === SCREEN_PAUSED) {
        overlay('PAUSED', ['The stars wait for you.', 'Press P or click to keep flying.'], '#9fe8ff');
      } else if (screen === SCREEN_OVER) {
        overlay('THE LIGHT FADES', [
          `Score ${s.score}  ·  Best ${Math.max(best, s.score)}  ·  Wave ${s.wave}`,
          'The seeds scatter back into the dark.',
          'Press SPACE or click to light the lantern again.',
        ], '#ff8fa3');
      } else if (screen === SCREEN_WIN) {
        overlay('DAWN RESTORED', [
          `Score ${s.score}  ·  Best ${Math.max(best, s.score)}`,
          'Every seed is home. The sky remembers the light.',
          'Press SPACE or click to play again.',
        ], '#ffd76a');
      }
    },
  };
}
