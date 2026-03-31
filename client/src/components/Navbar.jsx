export default function Navbar() {
  const handleBrandClick = () => {
    if (window.location.pathname === "/") {
      window.location.reload();
      return;
    }

    window.location.assign("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[#30363d] bg-[#0d1117]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between px-4 py-3 md:px-6 lg:px-8">
        <button
          type="button"
          onClick={handleBrandClick}
          className="group flex cursor-pointer items-center rounded-xl border border-transparent px-2 py-1.5 text-left transition duration-200 hover:border-[#30363d] hover:bg-white/5"
          aria-label="Reload Abandonment Scanner"
        >
          <div>
            <p className="font-display text-base font-semibold text-[#c9d1d9]">Abandonment Scanner</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#8b949e]">Leaflet Workspace</p>
          </div>
        </button>

        <div className="hidden items-center gap-2 rounded-full border border-[#30363d] bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-[#8b949e] md:inline-flex">
          <span className="inline-flex h-2 w-2 rounded-full bg-[#2ea44f]" />
          Operational
        </div>
      </div>
    </nav>
  );
}
