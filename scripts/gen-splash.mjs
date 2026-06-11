import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const OUT = new URL("public/splash/", ROOT);
const MASTER = new URL("public/icons/icon-512.png", ROOT).pathname.slice(1);
const out = (name) => new URL(name, OUT).pathname.slice(1);

const THEMES = {
  light: "#fbfaf7",
  dark: "#0c0a09",
};

const { devices } = JSON.parse(
  await readFile(new URL("lib/splash-devices.json", ROOT), "utf8"),
);

await mkdir(OUT, { recursive: true });

let count = 0;
for (const { width, height, ratio } of devices) {
  const w = Math.round(width * ratio);
  const h = Math.round(height * ratio);
  const mark = Math.min(512, Math.round(Math.min(w, h) * 0.3));
  const markBuf = await sharp(MASTER).resize(mark, mark).png().toBuffer();
  const top = Math.round((h - mark) / 2);
  const left = Math.round((w - mark) / 2);

  for (const [theme, background] of Object.entries(THEMES)) {
    const prefix = theme === "dark" ? "apple-splash-dark" : "apple-splash";
    await sharp({ create: { width: w, height: h, channels: 4, background } })
      .composite([{ input: markBuf, top, left }])
      .png({ palette: true, compressionLevel: 9, effort: 10 })
      .toFile(out(`${prefix}-${w}x${h}.png`));
    count++;
  }
}

console.log(`Generated ${count} splash images for ${devices.length} devices in`, OUT.pathname);
