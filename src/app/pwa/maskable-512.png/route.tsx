import { ImageResponse } from "next/og";
import { AppIconBookMark } from "@/lib/app-icon-mark";

export const dynamic = "force-static";
export function GET() {
  return new ImageResponse(
    <div style={{ width: 512, height: 512, display: "flex", alignItems: "center", justifyContent: "center", background: "#fffaf1" }}><AppIconBookMark size={384} /></div>,
    { width: 512, height: 512 },
  );
}
