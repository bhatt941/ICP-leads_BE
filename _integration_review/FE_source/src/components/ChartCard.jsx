import { ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

export function ChartCard({ title, children, height = 260 }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
