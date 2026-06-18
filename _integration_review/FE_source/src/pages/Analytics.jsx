import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/ChartCard";
import { PageHeader } from "@/components/PageHeader";
import { companiesByCountry, companiesByIndustry, companyGrowth, hiringTrends, leadsGenerated } from "@/services/analytics";

const colors = ["#14b8a6", "#f59e0b", "#6366f1", "#22c55e", "#ef4444", "#06b6d4", "#a855f7", "#84cc16"];

export default function Analytics() {
  return (
    <div>
      <PageHeader eyebrow="Signal analytics" title="Analytics" description="Track lead generation, hiring intensity, geography, industry mix, and company growth trends." />
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Leads Generated"><AreaChart data={leadsGenerated}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Area dataKey="leads" stroke="#14b8a6" fill="#14b8a633" /></AreaChart></ChartCard>
        <ChartCard title="Industry Distribution"><BarChart data={companiesByIndustry}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-18} height={58} /><YAxis /><Tooltip /><Bar dataKey="value" fill="#f59e0b" radius={[5, 5, 0, 0]} /></BarChart></ChartCard>
        <ChartCard title="Hiring Companies"><AreaChart data={hiringTrends}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="week" /><YAxis /><Tooltip /><Area dataKey="jobs" stroke="#6366f1" fill="#6366f133" /></AreaChart></ChartCard>
        <ChartCard title="Geographic Distribution"><PieChart><Pie data={companiesByCountry} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95}>{companiesByCountry.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ChartCard>
        <div className="xl:col-span-2"><ChartCard title="Company Growth"><AreaChart data={companyGrowth}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="quarter" /><YAxis /><Tooltip /><Area dataKey="headcount" stroke="#22c55e" fill="#22c55e33" /></AreaChart></ChartCard></div>
      </div>
    </div>
  );
}
