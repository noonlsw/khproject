const fs = require('fs');
let html = fs.readFileSync('hair-simulator.html', 'utf8');

// 1. CSS changes: add transform: scaleX(-1) to overlay and remove object-fit: cover (we will handle sizing dynamically)
html = html.replace(/#overlay \{([^}]*)\}/, `#overlay {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      transform: scaleX(-1);
    }`);

// 2. Remove manual flip in lp():
html = html.replace(/function lp\(lms, idx\) \{[\s\S]*?y: lms\[idx\]\.y \* H\n\s*};?\n\}/, `function lp(lms, idx) {
  return {
    x: lms[idx].x * W,
    y: lms[idx].y * H
  };
}`);

// 3. Update drawHair to use faceH for lift and pass dynamic offsets
html = html.replace(/const browL = lp\(lms, 107\);[\s\S]*?const topY\s*=\s*crown\.y - lift;/, `const lift = faceH * 0.35; // base lift on face height for stability
  const topY = crown.y - lift;`);

// 4. Update the onFrame handler to fix aspect ratio of wrap
html = html.replace(/if \(canvas\.width !== videoEl\.videoWidth \|\| canvas\.height !== videoEl\.videoHeight\) \{[\s\S]*?H = canvas\.height;\n\s*\}/, `if (canvas.width !== videoEl.videoWidth || canvas.height !== videoEl.videoHeight) {
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      W = canvas.width;
      H = canvas.height;
      const wrap = document.querySelector('.viewer-wrap');
      if (wrap && W > 0 && H > 0) {
        wrap.style.aspectRatio = Math.max(W, 1) + " / " + Math.max(H, 1);
      }
    }`);

// 5. Shift twoblock up (example of the first hair fix)
html = html.replace(/drawTwoblock\(cx, cY, topY, hL, hR, fw, fh, earY\) \{[\s\S]*?\/\/ ── 리젠트/m, `drawTwoblock(cx, cY, topY, hL, hR, fw, fh, earY) {
  ctx.beginPath();
  ctx.moveTo(hL + fw * 0.08, cY);
  ctx.bezierCurveTo(hL + fw * 0.02, topY + fh * 0.06, cx - fw * 0.25, topY - fh * 0.04, cx, topY - fh * 0.06);
  ctx.bezierCurveTo(cx + fw * 0.25, topY - fh * 0.04, hR - fw * 0.02, topY + fh * 0.06, hR - fw * 0.08, cY);
  ctx.quadraticCurveTo(cx, cY + fh * 0.02, hL + fw * 0.08, cY);
  ctx.fillStyle = hairColor(1);
  ctx.fill();

  for (const [sx, dir] of [[hL, 1], [hR, -1]]) {
    ctx.beginPath();
    ctx.moveTo(sx + fw * 0.06 * dir, cY);
    ctx.lineTo(sx, cY + fh * 0.1);
    ctx.lineTo(sx - fw * 0.015 * dir, earY + fh * 0.02);
    ctx.lineTo(sx + fw * 0.06 * dir, earY - fh * 0.04);
    ctx.lineTo(sx + fw * 0.1  * dir, cY + fh * 0.1);
    ctx.closePath();
    ctx.fillStyle = hairColor(0.52);
    ctx.fill();
  }

  ctx.strokeStyle = hairColor(0.22);
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const tx = hL + fw * 0.12 + i * (fw * 0.62 / 5);
    ctx.beginPath();
    ctx.moveTo(tx, cY - fh * 0.02);
    ctx.quadraticCurveTo(tx + fw * 0.01, topY + fh * 0.06, tx, topY + fh * 0.02);
    ctx.stroke();
  }
}

// ── 리젠트`);

fs.writeFileSync('hair-simulator.html', html);
console.log('Patched');
