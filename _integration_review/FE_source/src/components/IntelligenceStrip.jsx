import { Card } from "@/components/ui/Card";

export function IntelligenceStrip({ items }) {
  return (
    <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold">{item.value}</p>
            </div>
            {item.icon && <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/12 text-primary">{item.icon}</div>}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{item.detail}</p>
        </Card>
      ))}
    </div>
  );
}
