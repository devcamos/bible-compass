import { ImageResponse } from "next/og";
import { AppIconBookMark } from "@/lib/app-icon-mark";

export const dynamic = "force-static";
export function GET() {
  return new ImageResponse(<AppIconBookMark size={192} />, { width: 192, height: 192 });
}
