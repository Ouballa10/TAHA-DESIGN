import { ImageResponse } from "next/og";

import { renderPwaIcon } from "@/lib/pwa/icon-template";

export async function GET() {
  return new ImageResponse(renderPwaIcon("light"), {
    width: 180,
    height: 180,
  });
}
