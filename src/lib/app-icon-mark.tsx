type AppIconBookMarkProps = {
  size: number;
};

/** Nexus paper / copper open-book mark for favicon and apple-touch-icon. */
export function AppIconBookMark({ size }: AppIconBookMarkProps) {
  const bookW = Math.round(size * 0.56);
  const bookH = Math.round(size * 0.64);
  const radius = Math.max(2, Math.round(size * 0.06));
  const stroke = Math.max(1, size * 0.042);
  const spine = Math.max(1, size * 0.038);
  const lineW = Math.max(1, size * 0.032);
  const lineLen = Math.round(bookW * 0.22);
  const leftX = Math.round(bookW * 0.16);
  const rightX = Math.round(bookW * 0.58);
  const lines = [0.22, 0.42, 0.62].map((y) => Math.round(bookH * y));

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fffaf1",
      }}
    >
      <div
        style={{
          position: "relative",
          width: bookW,
          height: bookH,
          borderRadius: radius,
          background: "#f3ead8",
          border: `${stroke}px solid #1b1510`,
          display: "flex",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: spine,
            marginLeft: -spine / 2,
            background: "#b85a2a",
          }}
        />
        {lines.flatMap((y) => [
          <div
            key={`l-${y}`}
            style={{
              position: "absolute",
              left: leftX,
              top: y,
              width: lineLen,
              height: lineW,
              background: "#6d6254",
              borderRadius: lineW,
            }}
          />,
          <div
            key={`r-${y}`}
            style={{
              position: "absolute",
              left: rightX,
              top: y,
              width: lineLen,
              height: lineW,
              background: "#6d6254",
              borderRadius: lineW,
            }}
          />,
        ])}
      </div>
    </div>
  );
}
