import QRCode from 'qrcode';

export interface StyledQRCodeOptions {
  value: string;
  size?: number; // width/height in px
  fgColor?: string; // main QR color (default #000000)
  bgColor?: string; // background color (default #ffffff or transparent)
  margin?: number; // margin in modules
}

// Helper to check if a (row, col) position falls inside the 3 7x7 Finder Patterns
export function isFinderPattern(r: number, c: number, N: number): boolean {
  // Top-Left: rows 0..6, cols 0..6
  if (r < 7 && c < 7) return true;
  // Top-Right: rows 0..6, cols N-7..N-1
  if (r < 7 && c >= N - 7) return true;
  // Bottom-Left: rows N-7..N-1, cols 0..6
  if (r >= N - 7 && c < 7) return true;
  return false;
}

/**
 * Generates an SVG string for the Leaf-styled QR Code matching the exact design.
 */
export function generateStyledQRCodeSVG({
  value,
  size = 400,
  fgColor = '#000000',
  bgColor = '#ffffff',
  margin = 2,
}: StyledQRCodeOptions): string {
  if (!value) return '';

  const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
  const N = qr.modules.size;
  const totalModules = N + margin * 2;
  const pad = 0.08; // gap padding for smooth capsules
  const radius = (1 - 2 * pad) / 2; // 0.42

  let svgElements = '';

  // Background
  if (bgColor && bgColor !== 'transparent') {
    svgElements += `<rect width="${totalModules}" height="${totalModules}" fill="${bgColor}" />`;
  }

  // 1. DATA MODULES (Horizontal Capsule/Pill merging)
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (isFinderPattern(r, c, N)) continue;

      if (qr.modules.get(r, c)) {
        // Find length L of contiguous horizontal dark modules
        let cEnd = c;
        while (
          cEnd < N &&
          qr.modules.get(r, cEnd) &&
          !isFinderPattern(r, cEnd, N)
        ) {
          cEnd++;
        }
        const L = cEnd - c;

        const x = c + margin + pad;
        const y = r + margin + pad;
        const w = L - 2 * pad;
        const h = 1 - 2 * pad;

        svgElements += `<rect x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${w.toFixed(3)}" height="${h.toFixed(3)}" rx="${radius.toFixed(3)}" ry="${radius.toFixed(3)}" fill="${fgColor}" />`;

        c = cEnd - 1; // advance loop
      }
    }
  }

  // 2. FINDER PATTERNS (Leaf / Teardrop Outer Ring + Inner Eye Dot)
  // Base TL Leaf Outer Ring Path (7x7 modules)
  // Outer shape from (0,0) to (7,7), inner cutout from (1,1) to (6,6)
  // Top-Left corner (0,0) is pointed leaf tip.
  const tlOuterPath = `
    M 0 0
    L 4.2 0 A 2.8 2.8 0 0 1 7 2.8
    L 7 4.2 A 2.8 2.8 0 0 1 4.2 7
    L 2.8 7 A 2.8 2.8 0 0 1 0 4.2
    C 0 2.2, 1.2 1.2, 0 0 Z
    M 1 1.2
    C 1.8 1.8, 1 2.2, 1 3.8
    A 2.2 2.2 0 0 0 3.2 6
    L 3.8 6 A 2.2 2.2 0 0 0 6 3.8
    L 6 3.2 A 2.2 2.2 0 0 0 3.8 1
    L 1 1 Z
  `.replace(/\s+/g, ' ').trim();

  // Clean vector path for exact leaf outer frame (width 7, height 7)
  const leafOuterFrameSVG = `
    <path d="M 0 0 C 1 1, 0 2.5, 0 4.2 A 2.8 2.8 0 0 0 2.8 7 L 4.2 7 A 2.8 2.8 0 0 0 7 4.2 L 7 2.8 A 2.8 2.8 0 0 0 4.2 0 L 2.8 0 C 1.5 0, 1 0, 0 0 Z M 1.2 1.2 L 3.8 1 C 4.8 1, 6 2, 6 3.5 L 6 3.8 C 6 5, 5 6, 3.8 6 L 3.5 6 C 2 6 1 4.8 1 3.8 L 1 3.5 C 1 2.2, 1.2 1.2, 1.2 1.2 Z" fill="${fgColor}" fill-rule="evenodd" />
  `;

  // Standard Leaf Outer Frame Path with evenodd rule:
  // Outer contour: (0,0) pointed tip, (7,0) rounded, (7,7) rounded, (0,7) rounded
  // Inner cutout: (1,1) to (6,6)
  const makeFinderPattern = (
    mx: number,
    my: number,
    rotationDeg: number
  ) => {
    const cx = mx + 3.5;
    const cy = my + 3.5;

    // Exact Leaf Outer Ring Path (7x7)
    // Outer: M 0 0 L 4.5 0 A 2.5 2.5 0 0 1 7 2.5 L 7 4.5 A 2.5 2.5 0 0 1 4.5 7 L 2.5 7 A 2.5 2.5 0 0 1 0 4.5 Z
    // Cutout: M 1 1 L 1 4.2 A 1.8 1.8 0 0 0 2.8 6 L 4.2 6 A 1.8 1.8 0 0 0 6 4.2 L 6 2.8 A 1.8 1.8 0 0 0 4.2 1 Z
    const outerD = `
      M 0 0
      L 4.3 0 A 2.7 2.7 0 0 1 7 2.7
      L 7 4.3 A 2.7 2.7 0 0 1 4.3 7
      L 2.7 7 A 2.7 2.7 0 0 1 0 4.3
      C 0 2.8, 1.5 1.5, 0 0 Z
      M 1 1.2
      C 1.8 1.8, 1 2.8, 1 4.2
      A 1.8 1.8 0 0 0 2.8 6
      L 4.2 6
      A 1.8 1.8 0 0 0 6 4.2
      L 6 2.8
      A 1.8 1.8 0 0 0 4.2 1
      L 2.8 1
      C 1.8 1, 1.8 1, 1 1.2 Z
    `.replace(/\s+/g, ' ').trim();

    return `
      <g transform="translate(${mx}, ${my}) rotate(${rotationDeg}, 3.5, 3.5)">
        <!-- Leaf Outer Frame -->
        <path d="${outerD}" fill="${fgColor}" fill-rule="evenodd" />
        <!-- Inner Center Eye Dot (Circle/Disk) -->
        <circle cx="3.5" cy="3.5" r="1.55" fill="${fgColor}" />
      </g>
    `;
  };

  // Render 3 Finder Patterns:
  // TL: at (margin, margin), angle = 0
  svgElements += makeFinderPattern(margin, margin, 0);

  // TR: at (N - 7 + margin, margin), angle = 90
  svgElements += makeFinderPattern(N - 7 + margin, margin, 90);

  // BL: at (margin, N - 7 + margin), angle = 270 (-90)
  svgElements += makeFinderPattern(margin, N - 7 + margin, 270);

  const viewBox = `0 0 ${totalModules} ${totalModules}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size}" height="${size}" shape-rendering="geometricPrecision">${svgElements}</svg>`;
}

/**
 * Renders the Styled QR code onto a HTMLCanvasElement at specified resolution.
 */
export async function renderStyledQRCodeToCanvas(
  canvas: HTMLCanvasElement,
  value: string,
  pixelSize = 800,
  fgColor = '#000000',
  bgColor = '#ffffff'
): Promise<void> {
  const svgString = generateStyledQRCodeSVG({
    value,
    size: pixelSize,
    fgColor,
    bgColor,
    margin: 2,
  });

  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      canvas.width = pixelSize;
      canvas.height = pixelSize;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, pixelSize, pixelSize);
        ctx.drawImage(img, 0, 0, pixelSize, pixelSize);
      }
      URL.revokeObjectURL(url);
      resolve();
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

/**
 * Downloads the styled QR Code as a high-res PNG file.
 */
export async function downloadStyledQRCode(
  value: string,
  filename = 'qrcode.png',
  pixelSize = 1000
): Promise<void> {
  const canvas = document.createElement('canvas');
  await renderStyledQRCodeToCanvas(canvas, value, pixelSize);
  const dataUrl = canvas.toDataURL('image/png');

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
