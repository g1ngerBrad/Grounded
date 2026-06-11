import devicesData from "./splash-devices.json";

type Device = { label: string; width: number; height: number; ratio: number };
type StartupImage = { url: string; media: string };

const devices = devicesData.devices as Device[];

export const appleStartupImages: StartupImage[] = devices.flatMap(
  ({ width, height, ratio }) => {
    const w = Math.round(width * ratio);
    const h = Math.round(height * ratio);
    const base =
      `(device-width: ${width}px) and (device-height: ${height}px) ` +
      `and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`;
    return [
      {
        url: `/splash/apple-splash-${w}x${h}.png`,
        media: `${base} and (prefers-color-scheme: light)`,
      },
      {
        url: `/splash/apple-splash-dark-${w}x${h}.png`,
        media: `${base} and (prefers-color-scheme: dark)`,
      },
    ];
  },
);
