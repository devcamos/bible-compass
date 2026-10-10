import { ImageResponse } from "next/og";
import { AppIconBookMark } from "@/lib/app-icon-mark";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<AppIconBookMark size={32} />, size);
}
