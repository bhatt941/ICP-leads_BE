import { cn } from "@/utils/cn";

const tones = {
  teal: "bg-primary/12 text-primary",
  orange: "bg-accent/15 text-accent-foreground dark:text-accent",
  green: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
  red: "bg-red-500/12 text-red-600 dark:text-red-300",
  muted: "bg-muted text-muted-foreground",
};

export function Badge({ tone = "muted", className, ...props }) {
  return <span className={cn("inline-flex rounded-md px-2 py-1 text-xs font-medium", tones[tone], className)} {...props} />;
}
