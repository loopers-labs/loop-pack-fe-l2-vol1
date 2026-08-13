import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.join(__dirname, '../public/images/week-07/hero-original.jpg');
const OUT_DIR = path.join(__dirname, '../public/images/week-07');

const WIDTHS = [640, 1080, 1920];
const FORMATS = [
  { name: 'avif', options: { quality: 60 } },
  { name: 'webp', options: { quality: 75 } },
];

async function optimize() {
  for (const width of WIDTHS) {
    for (const format of FORMATS) {
      const outFile = path.join(OUT_DIR, `hero-${width}.${format.name}`);
      await sharp(INPUT)
        .resize(width)
        .toFormat(format.name, format.options)
        .toFile(outFile);

      const { size } = await sharp(outFile).metadata().then(() =>
        import('fs').then((fs) => fs.statSync(outFile))
      );
      console.log(`${path.basename(outFile)} — ${(size / 1024).toFixed(1)}KB`);
    }
  }
}

optimize().catch(console.error);
