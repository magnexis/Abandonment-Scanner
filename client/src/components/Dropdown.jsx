import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { Link } from "../lib/router";

export default function Dropdown({ label, items, open, onToggle, onClose, menuKey }) {
  const panelId = `menu-${menuKey}`;
  const buttonId = `${panelId}-button`;

  return (
    <div className="relative">
      <button
        id={buttonId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className={clsx(
          "inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ea44f]/40",
          open
            ? "border-[#2c974b] bg-[#2ea44f] text-white shadow-[0_0_0_1px_rgba(46,164,79,0.28)]"
            : "border-[#2c974b] bg-[#2ea44f] text-white hover:border-[#2ea44f] hover:bg-[#2c974b]"
        )}
      >
        {label}
        <ChevronDown
          size={15}
          className={clsx("transition duration-150", open ? "rotate-180 text-white" : "text-white")}
        />
      </button>

      <div
        id={panelId}
        role="menu"
        aria-labelledby={buttonId}
        className={clsx(
          "absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-[320px] origin-top-right rounded-2xl border border-[#30363d] bg-[#161b22] p-2 shadow-[0_18px_48px_rgba(1,4,9,0.55)] transition duration-150",
          open ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-2 scale-95 opacity-0"
        )}
      >
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            role="menuitem"
            onClick={onClose}
            className="block rounded-xl px-3 py-3 transition duration-150 hover:bg-[#2ea44f] focus:bg-[#2ea44f] focus:outline-none"
          >
            <p className="text-sm font-medium text-[#f0f6fc]">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-white">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
