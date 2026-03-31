import { useEffect, useRef, useState } from "react";
import { House } from "lucide-react";
import { useLocation, useNavigate } from "../lib/router";
import Dropdown from "./Dropdown.jsx";

const docsItems = [
  {
    label: "Getting Started",
    to: "/docs#getting-started",
    description: "Quick setup, scan flow, and route to the main workspace."
  },
  {
    label: "How Scanning Works",
    to: "/docs#how-scanning-works",
    description: "Radius scans, filters, and the abandonment scoring model."
  },
  {
    label: "API Usage",
    to: "/docs#api-usage",
    description: "Endpoints for scans, routes, reports, and saved locations."
  }
];

const aboutItems = [
  {
    label: "Why This Exists",
    to: "/about#why-this-exists",
    description: "The field problem the scanner is designed to solve."
  },
  {
    label: "Project Vision",
    to: "/about#project-vision",
    description: "What a launch-ready abandonment intelligence platform should provide."
  }
];

const moreItems = [
  {
    label: "Download",
    to: "/download",
    description: "Get the Windows desktop installer, release details, and system requirements."
  },
  {
    label: "Legal Disclaimer",
    to: "/legal#legal-disclaimer",
    description: "Limits of the data and how to use results responsibly."
  },
  {
    label: "Privacy",
    to: "/legal#privacy",
    description: "How scan activity, reports, and user location should be handled."
  },
  {
    label: "Contact",
    to: "/legal#contact",
    description: "Where to send corrections, requests, and partnership inquiries."
  }
];

export default function Header() {
  const [openMenu, setOpenMenu] = useState(null);
  const headerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const activeLabel =
    openMenu === "docs" || location.pathname === "/docs"
      ? "Docs"
      : openMenu === "about" || location.pathname === "/about"
        ? "About"
        : location.pathname === "/download"
          ? "Download"
        : openMenu === "more" || location.pathname === "/legal"
          ? "More"
          : "Dashboard";

  useEffect(() => {
    setOpenMenu(null);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const handleMouseDown = (event) => {
      if (!headerRef.current?.contains(event.target)) {
        setOpenMenu(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const toggleMenu = (menu) => {
    setOpenMenu((current) => (current === menu ? null : menu));
  };

  const handleBrandClick = () => {
    setOpenMenu(null);

    if (location.pathname === "/") {
      window.location.reload();
      return;
    }

    navigate("/");
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-50 border-b border-[#30363d] bg-[#0d1117]/88 backdrop-blur">
      <div className="mx-auto grid max-w-[1200px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-3">
        <button
          type="button"
          onClick={handleBrandClick}
          className="inline-flex items-center rounded-xl border border-transparent px-2 py-1.5 text-left transition duration-150 hover:border-[#30363d] hover:bg-white/5"
          aria-label="Reload Abandonment Scanner"
        >
          <div>
            <p className="font-display text-sm font-semibold text-[#2ea44f]">Abandonment Scanner</p>
            <div className="hidden h-[14px] overflow-hidden sm:block">
              <p
                key={activeLabel}
                className="animate-fadeIn font-mono text-[10px] uppercase tracking-[0.24em] text-[#7ee787]"
              >
                {activeLabel}
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={handleBrandClick}
          className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#2c974b] bg-[#2ea44f] text-white shadow-[0_0_0_1px_rgba(46,164,79,0.28)] transition duration-150 hover:border-[#2ea44f] hover:bg-[#2c974b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ea44f]/40"
          aria-label="Go to homepage"
          title="Home"
        >
          <House size={16} />
        </button>

        <nav className="ml-auto flex items-center gap-2">
          <Dropdown
            label="Docs"
            menuKey="docs"
            items={docsItems}
            open={openMenu === "docs"}
            onToggle={() => toggleMenu("docs")}
            onClose={() => setOpenMenu(null)}
          />
          <Dropdown
            label="About"
            menuKey="about"
            items={aboutItems}
            open={openMenu === "about"}
            onToggle={() => toggleMenu("about")}
            onClose={() => setOpenMenu(null)}
          />
          <Dropdown
            label="More"
            menuKey="more"
            items={moreItems}
            open={openMenu === "more"}
            onToggle={() => toggleMenu("more")}
            onClose={() => setOpenMenu(null)}
          />
        </nav>
      </div>
    </header>
  );
}
