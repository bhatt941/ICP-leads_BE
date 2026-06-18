import { cn } from "@/utils/cn";

export function Card({ className, ...props }) {
  return <section className={cn("glass rounded-lg p-5 shadow-soft", className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("mb-4 flex items-start justify-between gap-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h2 className={cn("text-base font-semibold tracking-normal", className)} {...props} />;
}
