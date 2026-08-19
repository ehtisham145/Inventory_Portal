export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
