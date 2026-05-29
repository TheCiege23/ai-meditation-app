
type SessionHistoryItem = {
  sessionId: string;
  mode: string;
  duration: string;
  text: string;
  isFavorite: boolean;
};

type HomeSessionListProps = {
  items: SessionHistoryItem[];
  darkMode: boolean;
  onToggleFavorite: (sessionId: string, currentFavorite: boolean) => void;
  onLoadSession: (item: SessionHistoryItem) => void;
};

export default function HomeSessionList({
  items,
  darkMode,
  onToggleFavorite,
  onLoadSession,
}: HomeSessionListProps) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div
          key={item.sessionId}
          className={`rounded-2xl border p-4 ${
            darkMode ? "border-white/10 bg-slate-900/75" : "border-slate-200 bg-white/80"
          }`}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className={`font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
              {item.mode === "breathing" ? "Breathing" : "Meditation"} | {item.duration}
            </p>
            <button
              onClick={() => onToggleFavorite(item.sessionId, item.isFavorite)}
              className={`rounded-lg px-2 py-1 text-xs ${
                darkMode ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-700"
              }`}
            >
              {item.isFavorite ? "Starred" : "Star"}
            </button>
          </div>
          <p className={`mb-3 line-clamp-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
            {item.text}
          </p>
          <button
            onClick={() => onLoadSession(item)}
            className={`rounded-lg px-3 py-1 text-xs ${
              darkMode ? "bg-slate-100 text-slate-900" : "bg-slate-800 text-white"
            }`}
          >
            Load
          </button>
        </div>
      ))}
      {items.length === 0 && (
        <p
          className={`rounded-2xl border border-dashed p-4 text-sm ${
            darkMode ? "border-white/10 text-slate-400" : "border-slate-300 text-slate-500"
          }`}
        >
          No sessions yet.
        </p>
      )}
    </div>
  );
}
