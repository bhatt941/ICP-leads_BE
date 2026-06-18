import { SearchX } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function EmptyState({ title = "No results found", description = "Try adjusting search or filters." }) {
  return (
    <Card className="flex min-h-48 flex-col items-center justify-center text-center">
      <SearchX size={30} className="text-muted-foreground" aria-hidden />
      <h2 className="mt-3 text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}
