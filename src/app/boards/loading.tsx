export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 lg:p-10">
      <div className="space-y-2">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="bg-muted h-4 w-64 animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-muted/40 aspect-4/3 animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}
