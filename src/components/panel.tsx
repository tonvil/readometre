export default function Panel({
  label,
  variant = "default",
  children,
}: {
  label: string;
  variant?: "default" | "danger";
  children: React.ReactNode;
}) {
  const labelColor = variant === "danger" ? "text-danger" : "text-accent";

  return (
    <div className="rounded-lg border border-panel-border bg-panel-bg p-4">
      <h4
        className={`mb-2.5 text-[11px] font-medium uppercase tracking-wide ${labelColor}`}
      >
        {label}
      </h4>
      {children}
    </div>
  );
}
