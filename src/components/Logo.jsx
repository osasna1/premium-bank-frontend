export default function Logo({ size = 40 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
      }}
      className="flex items-center justify-center rounded-lg bg-[#0057B8] text-white font-bold"
    >
      <span style={{ fontSize: size * 0.45 }}>PB</span>
    </div>
  );
}