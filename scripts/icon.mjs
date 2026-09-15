// Gera os ícones do app a partir de um SVG. Rode: node scripts/icon.mjs
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

// Sparkle (Phosphor, fill), caixa 256x256
const sparkle =
  'M208,144a15.78,15.78,0,0,1-10.42,14.94L146,178l-19,51.62a15.92,15.92,0,0,1-29.88,0L78,178l-51.62-19a15.92,15.92,0,0,1,0-29.88L78,110l19-51.62a15.92,15.92,0,0,1,29.88,0L146,110l51.62,19A15.78,15.78,0,0,1,208,144ZM152,48h16V64a8,8,0,0,0,16,0V48h16a8,8,0,0,0,0-16H184V16a8,8,0,0,0-16,0V32H152a8,8,0,0,0,0,16Zm88,32h-8V72a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0V96h8a8,8,0,0,0,0-16Z';

// `pad` = margem do glifo; maskable precisa de mais margem porque o Android recorta.
const svg = (size, pad) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#d47a95"/>
      <stop offset="1" stop-color="#a8496a"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.25" cy="0.15" r="0.7">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
  <rect width="${size}" height="${size}" fill="url(#glow)"/>
  <g transform="translate(${size * pad} ${size * pad}) scale(${(size * (1 - 2 * pad)) / 256})">
    <path d="${sparkle}" fill="#ffffff"/>
  </g>
</svg>`;

const out = async (file, size, pad) => {
  await sharp(Buffer.from(svg(size, pad))).png().toFile(file);
  console.log('ok', file);
};

await out('public/icon.png', 1024, 0.2);          // iOS recorta os cantos sozinho
await out('public/icon-maskable.png', 512, 0.28); // Android: zona segura maior
await out('public/apple-touch-icon.png', 180, 0.2);
writeFileSync('public/favicon.svg', svg(64, 0.16));
