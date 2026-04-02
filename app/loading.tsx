export default function Loading() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="h-5 rounded" style={{ background: "var(--color-border-light)", width: "60%" }} />
          <div className="h-4 rounded mt-2" style={{ background: "var(--color-border-light)", width: "40%" }} />
        </div>
      ))}
    </div>
  );
}
