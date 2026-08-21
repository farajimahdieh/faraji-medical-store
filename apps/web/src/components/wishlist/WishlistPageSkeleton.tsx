export function WishlistPageSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="flex animate-pulse flex-col gap-4 rounded-2xl border border-border bg-white p-4 sm:flex-row"
        >
          <div className="h-28 w-28 shrink-0 rounded-xl bg-medical-bg" />
          <div className="flex flex-1 flex-col justify-center gap-3">
            <div className="h-4 w-1/3 rounded bg-medical-bg" />
            <div className="h-3 w-1/4 rounded bg-medical-bg" />
            <div className="h-3 w-2/5 rounded bg-medical-bg" />
          </div>
        </div>
      ))}
    </div>
  );
}
