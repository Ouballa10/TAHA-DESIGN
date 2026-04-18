import { ImageResponse } from "next/og";

import { renderPwaIcon } from "@/lib/pwa/icon-template";

export async function GET() {
  return new ImageResponse(renderPwaIcon("brand"), {
    width: 192,
    height: 192,
  });
}
