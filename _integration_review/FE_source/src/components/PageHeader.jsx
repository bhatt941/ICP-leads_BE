export function PageHeader({ title, eyebrow, description, action }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
