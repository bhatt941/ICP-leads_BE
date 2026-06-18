import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";

export function StatCard({ label, value, detail, icon: Icon, accent = "text-primary" }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="min-h-32">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-normal">{value}</p>
          </div>
          {Icon && (
            <div className="grid h-10 w-10 place-items-center rounded-md bg-muted">
              <Icon className={accent} size={20} aria-hidden />
            </div>
          )}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{detail}</p>
      </Card>
    </motion.div>
  );
}
