import os from "node:os";
import { defineConfig } from "@apps-in-toss/web-framework/config";

import {
  BRAND_DISPLAY_NAME,
  BRAND_ICON_URL,
  BRAND_PRIMARY_COLOR,
} from "./src/core/config/brand";

function resolveWebHost() {
  const configuredHost = process.env.AIT_WEB_HOST?.trim();
  if (configuredHost) {
    return configuredHost;
  }

  const interfaces = os.networkInterfaces();
  const preferredInterfaceNames = ["en0", "en1", "eth0", "wlan0"];
  const candidates = [
    ...preferredInterfaceNames.flatMap((name) => (interfaces[name] ?? []).map((info) => ({ name, info }))),
    ...Object.entries(interfaces).flatMap(([name, infos]) => (infos ?? []).map((info) => ({ name, info }))),
  ];

  for (const candidate of candidates) {
    const { info } = candidate;
    if (info.family !== "IPv4" || info.internal || info.address.startsWith("169.254.")) {
      continue;
    }

    return info.address;
  }

  return "localhost";
}

const webHost = resolveWebHost();

export default defineConfig({
  appName: "vocachip",
  brand: {
    displayName: BRAND_DISPLAY_NAME,
    primaryColor: BRAND_PRIMARY_COLOR,
    icon: BRAND_ICON_URL, // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
  },
  web: {
    host: webHost,
    port: 5173,
    commands: {
      dev: "vite dev --host 0.0.0.0",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
