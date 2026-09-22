import { ImageResponse } from "next/og";
import { AppIconBookMark } from "@/lib/app-icon-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppIconBookMark size={180} />, size);
}
