export function RadiusControl({
  value,
  onChange
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Scan Radius</p>
        <span className="font-mono text-sm text-success">{value}m</span>
      </div>
      <input
        type="range"
        min={100}
        max={2000}
        step={100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#2ea44f]"
      />
      <div className="mt-2 flex justify-between text-[11px] text-muted">
        <span>100m</span>
        <span>2000m</span>
      </div>
    </div>
  );
}

