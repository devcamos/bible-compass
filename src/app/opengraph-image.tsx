import { ImageResponse } from "next/og";

export const alt = "Bible Compass";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#F7F5F0",
          color: "#2C2A26",
        }}
      >
        <div style={{ fontSize: 28, color: "#6B675E" }}>Bible Compass</div>
        <div style={{ fontSize: 72, fontWeight: 600, marginTop: 16 }}>Come as you are.</div>
        <div style={{ fontSize: 28, color: "#6B675E", marginTop: 24, maxWidth: 820 }}>
          Meet Scripture with an open heart, understand it in context, and take one faithful
          step at a time.
        </div>
      </div>
    ),
    size,
  );
}
