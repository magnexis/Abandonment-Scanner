export function LoadingSkeleton({ className = "h-24" }: { className?: string }) {
  return <div className={`animate-pulse-soft rounded-2xl bg-white/5 ${className}`} />;
}

