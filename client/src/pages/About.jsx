import { useEffect } from "react";
import { useLocation } from "../lib/router";

function useHashScroll() {
  const location = useLocation();

  useEffect(() => {
    const targetId = location.hash.replace("#", "");
    if (!targetId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.pathname]);
}

function Section({ id, eyebrow, title, children }) {
  return (
    <section id={id} className="rounded-3xl border border-border bg-panel/90 p-6 shadow-panel">
      <p className="text-xs uppercase tracking-[0.24em] text-muted">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl text-white">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  useHashScroll();

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-6 lg:px-8">
      <div className="mb-8 rounded-3xl border border-border bg-panel/90 p-6 shadow-panel">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">About</p>
        <h1 className="mt-2 font-display text-4xl text-white">Why The Scanner Exists</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          The product exists to make early-stage property review faster, safer, and more consistent. Instead of
          depending on instinct alone, teams get one place to compare neglect signals, route access, and surrounding
          scan context before committing field time.
        </p>
      </div>

      <div className="space-y-6">
        <Section id="why-this-exists" eyebrow="About" title="Why This Exists">
          <p>
            Property condition review is often fragmented across maps, spreadsheets, street-level observations, and
            loosely structured notes. Abandonment Scanner turns that into a shared geospatial workflow with visible
            confidence levels and transparent scoring factors.
          </p>
          <p>
            The goal is not to replace human judgment. It is to help teams decide what deserves a closer look and what
            is probably just noise.
          </p>
        </Section>

        <Section id="project-vision" eyebrow="About" title="Project Vision">
          <p>
            The long-term vision is a launch-ready platform that blends live parcel data, imagery-derived signals,
            routing, collaborative reporting, and defensible filtering rules into a single operational workspace.
          </p>
          <p>
            The current version already leans into that direction with simulated candidates, zone-aware scoring, and a
            UI that feels closer to a real SaaS control room than a prototype.
          </p>
        </Section>

        <Section id="data-sources" eyebrow="About" title="Data Sources">
          <p>
            Mapping is powered by Leaflet with dark CARTO tiles. Reverse geocoding relies on Nominatim, and route
            previews rely on OSRM. Building records and reports are stored locally in SQLite through the server layer.
          </p>
          <p>
            Score output mixes seeded records with simulated heuristics so the interface remains realistic even when
            full production data integrations are not yet attached.
          </p>
        </Section>
      </div>
    </div>
  );
}
