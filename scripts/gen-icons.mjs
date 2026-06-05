import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const ICONS = new URL("../public/icons/", import.meta.url);
const MASTER = new URL("icon-512.png", ICONS).pathname.slice(1);
await mkdir(ICONS, { recursive: true });

const out = (name) => new URL(name, ICONS).pathname.slice(1);

await sharp(MASTER).resize(192, 192).png().toFile(out("icon-192.png"));
await sharp(MASTER).resize(180, 180).png().toFile(out("apple-touch-icon.png"));

const PAD = Math.round(512 * 0.1);
await sharp({
  create: { width: 512, height: 512, channels: 4, background: "#bbeeef" },
})
  .composite([
    {
      input: await sharp(MASTER)
        .resize(512 - PAD * 2, 512 - PAD * 2)
        .png()
        .toBuffer(),
      top: PAD,
      left: PAD,
    },
  ])
  .png()
  .toFile(out("icon-maskable-512.png"));

const FAVICON_SIZES = [16, 32, 48];
const pngs = await Promise.all(
  FAVICON_SIZES.map((s) => sharp(MASTER).resize(s, s).png().toBuffer())
);

const header = Buffer.alloc(6);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(FAVICON_SIZES.length, 4);

let offset = 6 + 16 * FAVICON_SIZES.length;
const entries = FAVICON_SIZES.map((size, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(size, 0);
  e.writeUInt8(size, 1);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(pngs[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  return e;
});

await writeFile(
  new URL("../app/favicon.ico", import.meta.url).pathname.slice(1),
  Buffer.concat([header, ...entries, ...pngs])
);

console.log("Icons regenerated from", MASTER);
