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

export default function LegalPage() {
  useHashScroll();

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-6 lg:px-8">
      <div className="mb-8 rounded-3xl border border-border bg-panel/90 p-6 shadow-panel">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Legal</p>
        <h1 className="mt-2 font-display text-4xl text-white">Use, Privacy, And Contact</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          This page covers the operating assumptions behind the scanner, how information should be treated, and where
          users should direct product or compliance questions.
        </p>
      </div>

      <div className="space-y-6">
        <Section id="legal-disclaimer" eyebrow="Legal" title="Legal Disclaimer">
          <p>
            Abandonment scores are analytical signals only. They do not prove vacancy, ownership status, safety, code
            violations, or legal access rights. Users should verify all findings independently before acting on them in
            the field or in any operational process.
          </p>
          <p>
            The platform is intended to support review and triage. It is not a substitute for formal inspection,
            municipal records review, or professional legal advice.
          </p>
        </Section>

        <Section id="privacy" eyebrow="Legal" title="Privacy">
          <p>
            Uploaded reports, coordinates, and usage actions may reveal sensitive investigation patterns. Production
            deployments should apply access controls, retention policies, and audit practices appropriate for the
            organization using the software.
          </p>
          <p>
            Public geocoding and routing providers may receive location queries when scans or route previews are
            requested, so teams should review those dependencies before using the app in sensitive contexts.
          </p>
        </Section>

        <Section id="contact" eyebrow="Legal" title="Contact">
          <p>
            For corrections, legal questions, or implementation support, route communication through the product owner
            or engineering contact responsible for the deployment. If this app is being used in a municipal, research,
            or field-ops context, document an internal escalation path before distributing it broadly.
          </p>
          <p>
            A practical default is to maintain a dedicated support inbox and a clear process for flagging false
            positives, removal requests, or provider-level outages.
          </p>
        </Section>
      </div>
    </div>
  );
}
