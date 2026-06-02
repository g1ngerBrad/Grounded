import { HistoryList } from "@/components/HistoryList";

export default function Page() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Past interactions — revisit what you worked through.
        </p>
      </header>
      <HistoryList />
    </div>
  );
}
