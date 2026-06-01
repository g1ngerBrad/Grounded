// One-off icon generator. Run: node scripts/gen-icons.mjs
// Produces the PNG icons referenced by app/manifest.ts from a tree SVG.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const OUT = new URL("../public/icons/", import.meta.url);
await mkdir(OUT, { recursive: true });

// Transparent-background tree (matches public/icon.svg) for the "any" purpose.
const tree = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="l" x1="128" y1="80" x2="384" y2="360" gradientUnits="userSpaceOnUse">
    <stop stop-color="#34d399"/><stop offset="1" stop-color="#059669"/></linearGradient></defs>
  <circle cx="256" cy="180" r="96" fill="url(#l)"/>
  <circle cx="180" cy="232" r="76" fill="url(#l)"/>
  <circle cx="332" cy="232" r="76" fill="url(#l)"/>
  <rect x="240" y="236" width="32" height="160" rx="16" fill="#92400e"/>
  <path d="M168 404c40-28 64-28 88-28s48 0 88 28" stroke="#92400e" stroke-width="22" stroke-linecap="round" fill="none"/>
</svg>`;

// Maskable variant: full-bleed warm background + tree inside the safe zone.
const maskable = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="l" x1="160" y1="130" x2="360" y2="350" gradientUnits="userSpaceOnUse">
    <stop stop-color="#34d399"/><stop offset="1" stop-color="#059669"/></linearGradient></defs>
  <rect width="512" height="512" fill="#f0fdf4"/>
  <g transform="translate(74 74) scale(0.71)">
    <circle cx="256" cy="180" r="96" fill="url(#l)"/>
    <circle cx="180" cy="232" r="76" fill="url(#l)"/>
    <circle cx="332" cy="232" r="76" fill="url(#l)"/>
    <rect x="240" y="236" width="32" height="160" rx="16" fill="#92400e"/>
    <path d="M168 404c40-28 64-28 88-28s48 0 88 28" stroke="#92400e" stroke-width="22" stroke-linecap="round" fill="none"/>
  </g>
</svg>`;

await sharp(Buffer.from(tree)).resize(192, 192).png().toFile(new URL("icon-192.png", OUT).pathname.slice(1));
await sharp(Buffer.from(tree)).resize(512, 512).png().toFile(new URL("icon-512.png", OUT).pathname.slice(1));
await sharp(Buffer.from(maskable)).resize(512, 512).png().toFile(new URL("icon-maskable-512.png", OUT).pathname.slice(1));
// Apple touch icon (warm bg, no transparency)
await sharp(Buffer.from(maskable)).resize(180, 180).png().toFile(new URL("apple-touch-icon.png", OUT).pathname.slice(1));

console.log("Icons written to public/icons/");
