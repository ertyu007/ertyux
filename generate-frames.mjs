import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'public', 'frames');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const numFrames = 90;

for (let i = 1; i <= numFrames; i++) {
  const progress = i / numFrames;
  const angle = progress * Math.PI * 2;
  const cx = 400 + Math.cos(angle) * 150;
  const cy = 300 + Math.sin(angle) * 80;
  
  const scale = 0.6 + Math.abs(Math.sin(angle)) * 0.4;
  const color1 = '#4fd1c5'; // cyan
  const color2 = '#b794f4'; // purple

  const svg = `
  <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="transparent" />
    <circle cx="${cx}" cy="${cy}" r="${150 * scale}" fill="none" stroke="${color1}" stroke-width="4" opacity="0.8"/>
    <circle cx="${800 - cx}" cy="${600 - cy}" r="${150 * (1 - scale + 0.2)}" fill="none" stroke="${color2}" stroke-width="4" opacity="0.8"/>
    <circle cx="400" cy="300" r="${200 * progress}" fill="none" stroke="#f687b3" stroke-width="2" opacity="0.3" stroke-dasharray="10 10"/>
  </svg>
  `;

  const fileName = `frame_${i.toString().padStart(3, '0')}.svg`;
  fs.writeFileSync(path.join(outDir, fileName), svg.trim());
}

console.log(`Generated ${numFrames} frames in public/frames/`);
