import { useEffect, useState } from "react";
import { Download, HardDriveDownload, LaptopMinimalCheck, ScrollText } from "lucide-react";

const releaseNotes = [
  "Desktop packaging path added with Tauri scaffold and Windows build instructions.",
  "Signals intelligence, area analysis, and place enrichment are now part of the operational workflow.",
  "Dashboard interactions were upgraded with radar, fire, search, and warning animations.",
  "Routing, radius scans, and place-aware filtering were refined for a more realistic field workflow."
];

const versionInfo = {
  version: "v1.0.0",
  fileSize: "~18 MB",
  releaseDate: "March 31, 2026"
};

const systemRequirements = [
  "Windows 10 or newer",
  "4 GB RAM recommended",
  "Internet connection required for public geocoding and routing providers"
];

export default function DownloadPage() {
  const [downloadReady, setDownloadReady] = useState(false);
  const downloadUrl = import.meta.env.VITE_WINDOWS_DOWNLOAD_URL ?? "/downloads/abandonment-scanner.exe";

  useEffect(() => {
    const controller = new AbortController();

    fetch(downloadUrl, {
      method: "HEAD",
      signal: controller.signal
    })
      .then((response) => setDownloadReady(response.ok))
      .catch(() => setDownloadReady(false));

    return () => controller.abort();
  }, [downloadUrl]);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-6 lg:px-8">
      <div className="mb-8 overflow-hidden rounded-[32px] border border-[#30363d] bg-[radial-gradient(circle_at_top_left,rgba(46,164,79,0.18),transparent_42%),linear-gradient(180deg,rgba(22,27,34,0.96),rgba(13,17,23,0.99))] shadow-[0_24px_70px_rgba(1,4,9,0.35)]">
        <div className="px-6 py-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#2ea44f]/30 bg-[#2ea44f]/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-[#7ee787]">
              Desktop Build
            </span>
            <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[#8b949e]">
              SaaS + Windows App
            </span>
          </div>
          <h1 className="mt-4 font-display text-4xl text-white md:text-5xl">Download Abandonment Scanner</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            The desktop build packages the scanner into a native Windows application so teams can keep the same dark
            operational dashboard while distributing it through internal IT channels, GitHub Releases, or direct field
            deployment.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#30363d] bg-panel/90 p-6 shadow-panel">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-[#2ea44f]/25 bg-[#2ea44f]/12 p-3 text-[#7ee787]">
                <HardDriveDownload size={20} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted">Download</p>
                <h2 className="mt-1 font-display text-2xl text-white">Windows Installer</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Download the packaged Windows executable for the desktop edition. The installer uses the same frontend
              workspace and API-driven intelligence system as the browser build, but ships as a native desktop app.
            </p>
            <div className="mt-6">
              {downloadReady ? (
                <a
                  href={downloadUrl}
                  download
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#2c974b] bg-[#2ea44f] px-5 py-4 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(46,164,79,0.28)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#2c974b] hover:shadow-[0_0_28px_rgba(46,164,79,0.32)] active:scale-[0.99]"
                >
                  <Download size={18} />
                  Download for Windows (.exe)
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#2c974b]/40 bg-[#2ea44f]/60 px-5 py-4 text-sm font-semibold text-white/90"
                >
                  <Download size={18} />
                  Download for Windows (.exe)
                </button>
              )}
              <p className="mt-3 text-xs leading-6 text-muted">
                {downloadReady
                  ? "Desktop installer detected and ready to download."
                  : "No packaged installer is present in this workspace yet. Run the documented Tauri build flow, then publish the generated .exe to your release channel or copy it into the public downloads path."}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-[#30363d] bg-panel/90 p-6 shadow-panel">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white">
                <ScrollText size={20} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted">Release Notes</p>
                <h2 className="mt-1 font-display text-2xl text-white">Latest Desktop Highlights</h2>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
              {releaseNotes.map((note) => (
                <li key={note} className="rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
                  {note}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-[#30363d] bg-panel/90 p-6 shadow-panel">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Version Info</p>
            <h2 className="mt-2 font-display text-2xl text-white">{versionInfo.version}</h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted">Typical Installer Size</p>
                <p className="mt-2 text-sm text-slate-100">{versionInfo.fileSize}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted">Release Date</p>
                <p className="mt-2 text-sm text-slate-100">{versionInfo.releaseDate}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#30363d] bg-panel/90 p-6 shadow-panel">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-[#2ea44f]/25 bg-[#2ea44f]/12 p-3 text-[#7ee787]">
                <LaptopMinimalCheck size={20} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted">System Requirements</p>
                <h2 className="mt-1 font-display text-2xl text-white">Recommended Environment</h2>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
              {systemRequirements.map((requirement) => (
                <li key={requirement} className="rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
                  {requirement}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
