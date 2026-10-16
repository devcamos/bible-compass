import { ImageResponse } from "next/og";
import { AppIconBookMark } from "@/lib/app-icon-mark";

export const dynamic = "force-static";
export function GET() {
  return new ImageResponse(<AppIconBookMark size={512} />, { width: 512, height: 512 });
}
