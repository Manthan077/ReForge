export default function Navbar({ onOpenInfo }) {
  return (
    <div className="sticky top-0 z-40 bg-[var(--bg-main)]">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-end">
        <button
          onClick={onOpenInfo}
          className="h-11 w-11 rounded-2xl border border-[var(--border-subtle)] bg-white/5 hover:bg-white/10 transition flex items-center justify-center shadow-sm"
          aria-label="About ReForge"
          title="About ReForge"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
            <path
              d="M12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22Z"
              stroke="white"
              strokeWidth="2"
            />
            <path d="M12 17V11" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 8.2H12.01" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
