// Generates public/icon-192.png and public/icon-512.png: a dark square
// with "S" in acid green, per CLAUDE.md's design system.
import sharp from "sharp";
import path from "path";

function svg(size) {
  const fontSize = Math.round(size * 0.56);
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0A0A0A" />
  <text
    x="50%"
    y="52%"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="Arial, sans-serif"
    font-weight="700"
    font-size="${fontSize}"
    fill="#C8F060"
  >S</text>
</svg>`;
}

async function main() {
  const outDir = path.join(import.meta.dirname, "..", "public");
  for (const size of [192, 512]) {
    const buffer = Buffer.from(svg(size));
    await sharp(buffer)
      .png()
      .toFile(path.join(outDir, `icon-${size}.png`));
    console.log(`wrote icon-${size}.png`);
  }

  // iOS home-screen icon: without this, iOS screenshots the page instead.
  await sharp(Buffer.from(svg(180)))
    .png()
    .toFile(path.join(outDir, "apple-touch-icon.png"));
  console.log("wrote apple-touch-icon.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
