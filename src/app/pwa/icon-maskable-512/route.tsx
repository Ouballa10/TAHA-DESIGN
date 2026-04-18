import { ImageResponse } from "next/og";

import { renderPwaIcon } from "@/lib/pwa/icon-template";

export async function GET() {
  return new ImageResponse(renderPwaIcon("maskable"), {
    width: 512,
    height: 512,
  });
}
