export function USFlag({ className = "" }) {
  const red = "#B22234";
  const white = "#FFFFFF";
  const cantons = [
    0, 2.46, 4.92, 7.38, 9.85, 12.31, 14.77, 17.23, 19.69, 22.15, 24.62, 27.08,
    29.54,
  ];
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 32"
      role="img"
      aria-label="United States flag"
    >
      {cantons.map((y, i) => (
        <rect key={i} x="0" y={y} width="60" height="2.46" fill={i % 2 === 0 ? red : white} />
      ))}
      <rect x="0" y="0" width="24" height="17.23" fill="#3C3B6E" />
      {[
        [4.5, 3.2],
        [10, 3.2],
        [15.5, 3.2],
        [20, 3.2],
        [7.2, 8.2],
        [12.7, 8.2],
        [18.2, 8.2],
        [4.5, 13.2],
        [10, 13.2],
        [15.5, 13.2],
        [20, 13.2],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.1" fill={white} />
      ))}
    </svg>
  );
}

export function SpainFlag({ className = "" }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 30 20"
      role="img"
      aria-label="Spain flag"
    >
      <rect x="0" y="0" width="30" height="5" fill="#AA151B" />
      <rect x="0" y="5" width="30" height="10" fill="#F1BF00" />
      <rect x="0" y="15" width="30" height="5" fill="#AA151B" />
    </svg>
  );
}