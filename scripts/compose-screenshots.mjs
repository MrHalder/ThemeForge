import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return fallback;
};

const cwd = process.cwd();
const rawDir = path.resolve(cwd, getArg('--raw-dir', 'assets/screenshots/raw'));
const outDir = path.resolve(cwd, getArg('--out-dir', 'assets/screenshots'));
const iconsDir = getArg('--icons-dir', '/Users/ashutosh/Desktop/Icons/Minimal BW Theme 512px/icons');

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const buildOverlaySvg = (width, height, shapes) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${shapes.join('')}</svg>`;
};

const overlaySetup = (width, height, min) => {
  const rx = Math.round(min * 0.025);
  const stroke = 'stroke="#ffffff" stroke-opacity="0.06" stroke-width="1" fill="none"';
  return [
    `<rect x="${Math.round(width * 0.18)}" y="${Math.round(height * 0.28)}" width="${Math.round(width * 0.64)}" height="${Math.round(height * 0.32)}" rx="${rx}" ${stroke} />`,
    `<line x1="${Math.round(width * 0.30)}" y1="${Math.round(height * 0.14)}" x2="${Math.round(width * 0.70)}" y2="${Math.round(height * 0.14)}" ${stroke} />`,
    `<line x1="${Math.round(width * 0.34)}" y1="${Math.round(height * 0.17)}" x2="${Math.round(width * 0.66)}" y2="${Math.round(height * 0.17)}" ${stroke} />`
  ];
};

const overlayDetect = (width, height, min) => {
  const stroke = 'stroke="#ffffff" stroke-opacity="0.04" stroke-width="1" fill="none"';
  const lines = Array.from({ length: 6 }).map((_, idx) => {
    const y = Math.round(height * 0.30 + idx * height * 0.03);
    return `<line x1="${Math.round(width * 0.30)}" y1="${y}" x2="${Math.round(width * 0.70)}" y2="${y}" ${stroke} />`;
  });
  const focus = `<rect x="${Math.round(width * 0.34)}" y="${Math.round(height * 0.24)}" width="${Math.round(width * 0.32)}" height="${Math.round(height * 0.22)}" rx="${Math.round(min * 0.02)}" ${stroke} />`;
  return [...lines, focus];
};

const overlayTheme = (width, height, min) => {
  const size = Math.round(min * 0.016);
  const gap = Math.round(size * 1.5);
  const startX = Math.round(width * 0.32);
  const y = Math.round(height * 0.29);
  const stroke = 'stroke="#ffffff" stroke-opacity="0.05" stroke-width="1" fill="none"';
  const squares = Array.from({ length: 8 }).map((_, idx) => {
    const x = startX + idx * gap;
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" ${stroke} />`;
  });
  return squares;
};

const overlayGenerate = (width, height, min) => {
  const r = Math.round(min * 0.18);
  const cx = Math.round(width * 0.5);
  const cy = Math.round(height * 0.30);
  const strokeWidth = Math.max(1, Math.round(min * 0.004));
  const ring = `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="#ffffff" stroke-opacity="0.05" stroke-width="${strokeWidth}" stroke-dasharray="${Math.round(r * 0.6)} ${Math.round(r * 0.35)}" fill="none" />`;
  const line = `<line x1="${Math.round(width * 0.36)}" y1="${Math.round(height * 0.42)}" x2="${Math.round(width * 0.64)}" y2="${Math.round(height * 0.42)}" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1" />`;
  return [ring, line];
};

const overlayDownload = (width, height, min) => {
  const stroke = 'stroke="#ffffff" stroke-opacity="0.05" stroke-width="2" fill="none"';
  const cx = Math.round(width * 0.5);
  const top = Math.round(height * 0.42);
  const bottom = Math.round(height * 0.53);
  const arrow = `<path d="M ${cx} ${top} L ${cx} ${bottom} M ${cx} ${bottom} L ${cx - Math.round(min * 0.02)} ${bottom - Math.round(min * 0.02)} M ${cx} ${bottom} L ${cx + Math.round(min * 0.02)} ${bottom - Math.round(min * 0.02)}" ${stroke} />`;
  const tray = `<line x1="${Math.round(width * 0.42)}" y1="${Math.round(height * 0.56)}" x2="${Math.round(width * 0.58)}" y2="${Math.round(height * 0.56)}" stroke="#ffffff" stroke-opacity="0.05" stroke-width="2" />`;
  return [arrow, tray];
};

const steps = [
  {
    name: 'step-1-setup',
    input: 'step-1-setup.png',
    output: 'step-1-setup.png',
    icons: [
      { file: 'Settings.png', x: 0.12, y: 0.18, size: 0.11, strength: 0.22, blur: 0.4, rotate: -6 },
      { file: 'Utilities.png', x: 0.88, y: 0.18, size: 0.10, strength: 0.2, blur: 0.4, rotate: 6 },
      { file: 'App_Store.png', x: 0.12, y: 0.78, size: 0.12, strength: 0.2, blur: 0.5, rotate: -4 },
      { file: 'ChatGPT.png', x: 0.88, y: 0.78, size: 0.11, strength: 0.2, blur: 0.4, rotate: 4 }
    ],
    overlay: overlaySetup
  },
  {
    name: 'step-2-detect',
    input: 'step-2-detect.png',
    output: 'step-2-detect.png',
    icons: [
      { file: 'Camera.png', x: 0.12, y: 0.32, size: 0.11, strength: 0.22, blur: 0.4, rotate: -6 },
      { file: 'Photos.png', x: 0.88, y: 0.32, size: 0.11, strength: 0.2, blur: 0.4, rotate: 6 },
      { file: 'Maps.png', x: 0.12, y: 0.72, size: 0.11, strength: 0.2, blur: 0.4, rotate: -4 },
      { file: 'Messages.png', x: 0.88, y: 0.72, size: 0.11, strength: 0.2, blur: 0.4, rotate: 4 },
      { file: 'WA_Business.png', x: 0.50, y: 0.84, size: 0.09, strength: 0.18, blur: 0.4, rotate: 0 }
    ],
    overlay: overlayDetect
  },
  {
    name: 'step-3-theme',
    input: 'step-3-theme.png',
    output: 'step-3-theme.png',
    icons: [
      { file: 'App_Store.png', x: 0.15, y: 0.22, size: 0.10, strength: 0.2, blur: 0.4, rotate: -6 },
      { file: 'TV.png', x: 0.85, y: 0.22, size: 0.10, strength: 0.2, blur: 0.4, rotate: 6 },
      { file: 'YouTube.png', x: 0.15, y: 0.78, size: 0.11, strength: 0.2, blur: 0.5, rotate: -4 },
      { file: 'Notion_Calendar.png', x: 0.85, y: 0.78, size: 0.11, strength: 0.2, blur: 0.5, rotate: 4 },
      { file: 'Weather.png', x: 0.50, y: 0.84, size: 0.09, strength: 0.18, blur: 0.4, rotate: 0 }
    ],
    overlay: overlayTheme
  },
  {
    name: 'step-4-generate',
    input: 'step-4-generate.png',
    output: 'step-4-generate.png',
    icons: [
      { file: 'GitHub.png', x: 0.16, y: 0.25, size: 0.11, strength: 0.2, blur: 0.4, rotate: -6 },
      { file: 'Claude.png', x: 0.84, y: 0.25, size: 0.11, strength: 0.2, blur: 0.4, rotate: 6 },
      { file: 'ChatGPT.png', x: 0.16, y: 0.78, size: 0.11, strength: 0.2, blur: 0.4, rotate: -4 },
      { file: 'Utilities.png', x: 0.84, y: 0.78, size: 0.11, strength: 0.2, blur: 0.4, rotate: 4 }
    ],
    overlay: overlayGenerate
  },
  {
    name: 'step-5-download',
    input: 'step-5-download.png',
    output: 'step-5-download.png',
    icons: [
      { file: 'Mail.png', x: 0.16, y: 0.25, size: 0.11, strength: 0.2, blur: 0.4, rotate: -6 },
      { file: 'Messages.png', x: 0.84, y: 0.25, size: 0.11, strength: 0.2, blur: 0.4, rotate: 6 },
      { file: 'Photos.png', x: 0.16, y: 0.78, size: 0.11, strength: 0.2, blur: 0.4, rotate: -4 },
      { file: 'Maps.png', x: 0.84, y: 0.78, size: 0.11, strength: 0.2, blur: 0.4, rotate: 4 },
      { file: 'Health.png', x: 0.50, y: 0.84, size: 0.09, strength: 0.18, blur: 0.4, rotate: 0 }
    ],
    overlay: overlayDownload
  }
];

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const prepareIcon = async (iconPath, size, strength, blur, rotate) => {
  let img = sharp(iconPath)
    .resize(size, size, { fit: 'contain' })
    .rotate(rotate || 0, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha();

  if (blur && blur > 0) img = img.blur(blur);
  if (strength && strength !== 1) img = img.modulate({ brightness: strength });

  return img.png().toBuffer();
};

const run = async () => {
  await ensureDir(outDir);

  for (const step of steps) {
    const inputPath = path.join(rawDir, step.input);
    const outputPath = path.join(outDir, step.output);

    if (!(await fileExists(inputPath))) {
      throw new Error(`Missing base screenshot: ${inputPath}`);
    }

    const meta = await sharp(inputPath).metadata();
    const width = meta.width || 0;
    const height = meta.height || 0;

    if (!width || !height) {
      throw new Error(`Invalid image metadata for ${inputPath}`);
    }

    const min = Math.min(width, height);
    const composites = [];

    for (const icon of step.icons) {
      const iconPath = path.join(iconsDir, icon.file);
      if (!(await fileExists(iconPath))) {
        throw new Error(`Missing icon file: ${iconPath}`);
      }

      const sizePx = Math.round(min * icon.size);
      const left = clamp(Math.round(width * icon.x - sizePx / 2), 0, width - sizePx);
      const top = clamp(Math.round(height * icon.y - sizePx / 2), 0, height - sizePx);

      const buffer = await prepareIcon(iconPath, sizePx, icon.strength, icon.blur, icon.rotate);

      composites.push({
        input: buffer,
        left,
        top,
        blend: 'screen'
      });
    }

    const overlayShapes = step.overlay(width, height, min);
    const overlaySvg = buildOverlaySvg(width, height, overlayShapes);
    composites.push({ input: Buffer.from(overlaySvg), left: 0, top: 0, blend: 'over' });

    await sharp(inputPath).composite(composites).png().toFile(outputPath);
    console.log(`Wrote ${outputPath}`);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
