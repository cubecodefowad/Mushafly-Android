/**
 * Generate Android icon assets from the existing Mushafly leaf mark.
 *
 * Dependency-light on purpose: pngjs only. The source marks live in the web
 * app's `public/brand/` directory and are used here without redrawing them.
 */
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const WEB_BRAND = path.resolve(ROOT, "..", "public", "brand");
const OUT = path.join(ROOT, "assets", "images");
const PAPER = { r: 0xfa, g: 0xf8, b: 0xf3, a: 255 };

function readPng(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

function trim(png, threshold = 8) {
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      if (png.data[(y * png.width + x) * 4 + 3] > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) throw new Error("Brand mark is fully transparent");
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const out = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const from = ((y + minY) * png.width + (x + minX)) * 4;
      const to = (y * width + x) * 4;
      out.data[to] = png.data[from];
      out.data[to + 1] = png.data[from + 1];
      out.data[to + 2] = png.data[from + 2];
      out.data[to + 3] = png.data[from + 3];
    }
  }
  return out;
}

function sample(png, x, y) {
  const clampedX = Math.max(0, Math.min(png.width - 1, x));
  const clampedY = Math.max(0, Math.min(png.height - 1, y));
  const i = (Math.floor(clampedY) * png.width + Math.floor(clampedX)) * 4;
  return [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]];
}

function resize(png, width, height) {
  const out = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    const sy = (y + 0.5) * (png.height / height) - 0.5;
    for (let x = 0; x < width; x++) {
      const sx = (x + 0.5) * (png.width / width) - 0.5;
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const fx = sx - x0;
      const fy = sy - y0;
      const p00 = sample(png, x0, y0);
      const p10 = sample(png, x0 + 1, y0);
      const p01 = sample(png, x0, y0 + 1);
      const p11 = sample(png, x0 + 1, y0 + 1);
      const blend = (index) =>
        Math.round(
          (p00[index] * (1 - fx) + p10[index] * fx) * (1 - fy) +
            (p01[index] * (1 - fx) + p11[index] * fx) * fy,
        );
      const to = (y * width + x) * 4;
      out.data[to] = blend(0);
      out.data[to + 1] = blend(1);
      out.data[to + 2] = blend(2);
      out.data[to + 3] = blend(3);
    }
  }
  return out;
}

function canvas(width, height, background = null) {
  const out = new PNG({ width, height });
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = background?.r ?? 0;
    out.data[i + 1] = background?.g ?? 0;
    out.data[i + 2] = background?.b ?? 0;
    out.data[i + 3] = background?.a ?? 0;
  }
  return out;
}

function draw(target, source, left, top) {
  for (let y = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {
      const from = (y * source.width + x) * 4;
      const to = ((y + top) * target.width + (x + left)) * 4;
      const sa = source.data[from + 3] / 255;
      if (sa === 0) continue;
      target.data[to] = Math.round(source.data[from] * sa + target.data[to] * (1 - sa));
      target.data[to + 1] = Math.round(
        source.data[from + 1] * sa + target.data[to + 1] * (1 - sa),
      );
      target.data[to + 2] = Math.round(
        source.data[from + 2] * sa + target.data[to + 2] * (1 - sa),
      );
      target.data[to + 3] = Math.max(target.data[to + 3], source.data[from + 3]);
    }
  }
}

function place(mark, size, markWidth, background, tint = null) {
  const scaled = resize(mark, markWidth, Math.round((mark.height / mark.width) * markWidth));
  if (tint) {
    for (let i = 0; i < scaled.data.length; i += 4) {
      scaled.data[i] = tint.r;
      scaled.data[i + 1] = tint.g;
      scaled.data[i + 2] = tint.b;
    }
  }
  const out = canvas(size, size, background);
  draw(out, scaled, Math.round((size - scaled.width) / 2), Math.round((size - scaled.height) / 2));
  return out;
}

function write(file, png) {
  fs.writeFileSync(file, PNG.sync.write(png));
  console.log(`wrote ${path.relative(ROOT, file)} (${png.width}x${png.height})`);
}

fs.mkdirSync(OUT, { recursive: true });
const lightMark = trim(readPng(path.join(WEB_BRAND, "mark-light.png")));
const darkMark = trim(readPng(path.join(WEB_BRAND, "mark-dark.png")));

write(path.join(OUT, "icon.png"), place(lightMark, 1024, 660, PAPER));
write(path.join(OUT, "adaptive-icon.png"), place(lightMark, 1024, 600, null));
write(path.join(OUT, "monochrome-icon.png"), place(lightMark, 1024, 600, null, { r: 255, g: 255, b: 255 }));
write(path.join(OUT, "splash-icon.png"), place(lightMark, 512, 330, null));
write(path.join(OUT, "favicon.png"), place(lightMark, 48, 34, PAPER));

// Keep the in-app theme variants next to the generated icons.
fs.writeFileSync(path.join(OUT, "mark-light.png"), PNG.sync.write(lightMark));
fs.writeFileSync(path.join(OUT, "mark-dark.png"), PNG.sync.write(darkMark));
console.log("wrote assets/images/mark-light.png and mark-dark.png");
