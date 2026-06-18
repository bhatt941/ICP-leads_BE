import { cn } from "@/utils/cn";

const variants = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  secondary: "border border-border bg-card hover:bg-muted",
  ghost: "hover:bg-muted",
  accent: "bg-accent text-accent-foreground hover:opacity-90",
};

export function Button({ className, variant = "primary", size = "md", ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
