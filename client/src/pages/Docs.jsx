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

function Section({ id, eyebrow, title, summary, children }) {
  return (
    <section
      id={id}
      className="overflow-hidden rounded-[28px] border border-[#30363d] bg-[linear-gradient(180deg,rgba(22,27,34,0.98),rgba(13,17,23,0.98))] shadow-[0_20px_60px_rgba(1,4,9,0.35)]"
    >
      <div className="border-b border-white/5 px-6 py-5">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[#7ee787]">{eyebrow}</p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-3xl text-white">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">{summary}</p>
          </div>
          <div className="rounded-2xl border border-[#2ea44f]/20 bg-[#2ea44f]/10 px-4 py-3 font-mono text-xs text-[#7ee787]">
            Startup-grade docs
          </div>
        </div>
      </div>
      <div className="space-y-4 px-6 py-6 text-sm leading-7 text-slate-300">{children}</div>
    </section>
  );
}

function DocCallout({ title, body }) {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
      <p className="font-medium text-white">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate-300">{body}</p>
    </div>
  );
}

function ChatBubble({ role, children }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-[22px] rounded-br-md bg-[#2ea44f] px-4 py-3 text-sm leading-6 text-white shadow-[0_10px_24px_rgba(46,164,79,0.28)]"
            : "max-w-[85%] rounded-[22px] rounded-bl-md border border-[#30363d] bg-[#1c2128] px-4 py-3 text-sm leading-6 text-slate-100 shadow-[0_10px_24px_rgba(1,4,9,0.22)]"
        }
      >
        {children}
      </div>
    </div>
  );
}

export default function DocsPage() {
  useHashScroll();

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-6 lg:px-8">
      <div className="mb-8 overflow-hidden rounded-[32px] border border-[#30363d] bg-[radial-gradient(circle_at_top_left,rgba(46,164,79,0.18),transparent_38%),linear-gradient(180deg,rgba(22,27,34,0.96),rgba(13,17,23,0.98))] shadow-[0_24px_70px_rgba(1,4,9,0.35)]">
        <div className="px-6 py-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#2ea44f]/30 bg-[#2ea44f]/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-[#7ee787]">
              Documentation
            </span>
            <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[#8b949e]">
              Product Guide
            </span>
          </div>
          <h1 className="mt-4 font-display text-4xl text-white md:text-5xl">Operational Guide</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            Abandonment Scanner is designed to feel like an investigator’s control room rather than a simple map
            search. The documentation below explains how the workspace behaves, what the scoring engine is actually
            doing, and how to interpret results without treating the product like an infallible truth machine.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Section
          id="getting-started"
          eyebrow="Docs"
          title="Getting Started"
          summary="Use the map as your primary control surface, then let the scanner fill in context, confidence, and routeability around the selected property."
        >
          <p>
            The fastest way to work is to open the main scanner workspace, click directly on the map, and let the
            platform reverse geocode that point before generating a scored property record. From there, the scanner
            updates the selected location, nearby candidates, heatmap context, and route preview state without forcing
            you into a page change or a second modal step.
          </p>
          <p>
            If you already know the area you want to inspect, start with a commercial corridor, warehouse edge, or
            industrial block and widen the radius slider until it captures the surrounding footprint you care about.
            That makes it easier to compare one suspicious structure against others in the same operating context
            instead of reviewing a single point in isolation.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <DocCallout
              title="Recommended Flow"
              body="Click map, confirm the resolved address, review the abandonment score, then open route preview only after the candidate looks worth field time."
            />
            <DocCallout
              title="Why It Feels Fast"
              body="The interface keeps scanning, candidate refresh, and detail review in one screen, which cuts down the usual back-and-forth between maps, notes, and routing tabs."
            />
          </div>
        </Section>

        <Section
          id="how-scanning-works"
          eyebrow="Docs"
          title="How Scanning Works"
          summary="Scores are built from a mix of persisted data and realistic simulated signals so the interface remains believable while still being safe to demo."
        >
          <p>
            The scan engine starts with a selected coordinate, resolves the surrounding address context, and then
            combines stored building records with generated candidates inside the active radius. Every candidate is
            evaluated against the same core signals: inactivity, visible decay, vegetation pressure, report density,
            sale recency, and localized confidence based on how much context the system can gather around that point.
          </p>
          <p>
            That output is then translated into a score band, a readable status, and a short summary designed to help a
            human decide whether the property deserves deeper review. The goal is triage. A strong score should tell
            you that the place is worth verifying, not that the system has legally proven abandonment.
          </p>
          <div className="grid gap-4 lg:grid-cols-3">
            <DocCallout
              title="Signal Bias"
              body="Industrial, warehouse, and visibly inactive commercial contexts are weighted more aggressively because they are more likely to produce meaningful abandonment candidates."
            />
            <DocCallout
              title="Residential Safeguard"
              body="Residential parcels are treated conservatively so houses do not accidentally get elevated into high-risk abandonment results."
            />
            <DocCallout
              title="Heatmap Link"
              body="The heatmap mirrors these same factors, so a red cluster on the map is visual shorthand for a concentration of suspicious signals rather than a separate model."
            />
          </div>
        </Section>

        <Section
          id="api-usage"
          eyebrow="Docs"
          title="API Usage"
          summary="The client talks to a lightweight JSON API designed for real-time UI updates instead of heavyweight data transfer."
        >
          <p>
            The frontend relies on a small set of endpoints for scanning, loading persisted locations, composing
            reports, and requesting routes. Most requests are centered around coordinates plus minimal control values
            such as `radiusMeters` or a route profile. That keeps the client responsive and reduces the amount of
            transformation work needed after every interaction.
          </p>
          <p>
            In practice, a typical session sends a scan request when the user clicks the map, refreshes detailed
            building data only when a specific record is selected, and then submits a route request only when the user
            actively asks to navigate. That separation matters because it lets the workspace feel live without wasting
            API calls on every little UI state change.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <DocCallout
              title="Common Scan Payload"
              body="A standard scan sends either a free-text query or a lat/lng coordinate along with the active radius, then receives the main building result, nearby candidates, heatmap points, and routing origin hints."
            />
            <DocCallout
              title="Common Route Payload"
              body="Route requests include an origin, a destination, and a profile such as walking or driving so the map can draw a valid path instead of a straight-line guess."
            />
          </div>
        </Section>

        <Section
          id="faq"
          eyebrow="Docs"
          title="FAQ"
          summary="A quick-answer thread for the questions people ask most when they first start trusting the scanner."
        >
          <div className="mx-auto max-w-3xl rounded-[30px] border border-[#30363d] bg-[#11161d] p-4 shadow-[0_24px_60px_rgba(1,4,9,0.34)]">
            <div className="mb-4 flex items-center justify-center">
              <div className="h-1.5 w-20 rounded-full bg-white/10" />
            </div>
            <div className="space-y-3">
              <ChatBubble role="user">Are scan results authoritative?</ChatBubble>
              <ChatBubble role="assistant">
                No. The scanner is a prioritization tool. It helps you identify which properties deserve review, but it
                does not replace formal inspection, ownership checks, or municipal record validation.
              </ChatBubble>

              <ChatBubble role="user">Why are some areas filtered or downgraded?</ChatBubble>
              <ChatBubble role="assistant">
                Residential contexts are intentionally handled defensively. That keeps houses from being mislabeled as
                high-risk abandonment targets and reduces false positives in everyday neighborhoods.
              </ChatBubble>

              <ChatBubble role="user">What happens if routing or geocoding is unavailable?</ChatBubble>
              <ChatBubble role="assistant">
                The app degrades gracefully. You can still review scores and saved context, and route preview falls
                back to a simulated experience so the workflow stays intact during provider outages.
              </ChatBubble>

              <ChatBubble role="user">What should I look at first after a scan?</ChatBubble>
              <ChatBubble role="assistant">
                Start with the score band, confidence, and summary. If those look compelling, compare nearby candidates
                and only then spend time on route planning or field follow-up.
              </ChatBubble>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
