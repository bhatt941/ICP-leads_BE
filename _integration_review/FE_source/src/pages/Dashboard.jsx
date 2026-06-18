import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";
import { Bot, BriefcaseBusiness, Building2, Sparkles, Target, Users, UserRoundSearch } from "lucide-react";
import { ChartCard } from "@/components/ChartCard";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMockQuery } from "@/hooks/useMockQuery";
import { aiInsights, companies, contacts, jobPosts, navInsights } from "@/data/mockData";
import { companiesByCountry, companiesByIndustry, headcountDistribution, hiringTrends } from "@/services/analytics";

const colors = ["#14b8a6", "#f59e0b", "#6366f1", "#22c55e", "#ef4444", "#06b6d4", "#a855f7", "#84cc16"];

export default function Dashboard() {
  const { data, isLoading } = useMockQuery("dashboard", () => ({ companies, contacts, jobPosts }));

  return (
    <div>
      <PageHeader
        eyebrow="Command center"
        title="Lead Intelligence Dashboard"
        description="Prioritize target accounts using hiring signals, decision-maker coverage, company growth, and AI lead scoring."
      />

      <Card className="mb-5 overflow-hidden border-primary/25 bg-primary/8">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr] lg:items-center">
          <div>
            <Badge tone="teal">AI-powered market console</Badge>
            <h2 className="mt-3 text-2xl font-semibold tracking-normal">Find the right accounts before they enter a buying cycle.</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Combine firmographics, department hiring, geography, decision-maker coverage, and lead scoring to build focused prospecting lists.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Sector filters", "Industry filters", "Location filters", "Department signals", "Lead scoring"].map((item) => (
                <Badge key={item} tone="orange">{item}</Badge>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card/70 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
                <Bot size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold">AI Recommendations</p>
                <p className="text-xs text-muted-foreground">3 high-intent segments detected</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {aiInsights.slice(0, 3).map((item) => (
                <div key={item.title} className="flex items-start gap-2 rounded-md bg-muted/35 p-3">
                  <Sparkles size={15} className="mt-0.5 shrink-0 text-accent" />
                  <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{item.impact}:</span> {item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {isLoading && !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total Companies" value={navInsights.totalCompanies} detail="Accounts enriched from local intelligence" icon={Building2} />
          <StatCard label="Total Contacts" value={navInsights.totalContacts} detail="Decision makers mapped" icon={Users} />
          <StatCard label="Total Leads" value={navInsights.totalLeads} detail="Qualified and active records" icon={Target} accent="text-accent" />
          <StatCard label="Active Hiring" value={navInsights.activeHiringCompanies} detail="Companies showing talent demand" icon={BriefcaseBusiness} />
          <StatCard label="Average Headcount" value={navInsights.averageHeadcount.toLocaleString()} detail="Across tracked companies" icon={UserRoundSearch} />
        </div>
      )}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <ChartCard title="Companies by Industry">
          <BarChart data={companiesByIndustry}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-18} height={58} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" radius={[5, 5, 0, 0]} fill="#14b8a6" />
          </BarChart>
        </ChartCard>
        <ChartCard title="Companies by Country">
          <PieChart>
            <Pie data={companiesByCountry} dataKey="value" nameKey="name" innerRadius={58} outerRadius={94} paddingAngle={2}>
              {companiesByCountry.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ChartCard>
        <ChartCard title="Hiring Trend">
          <AreaChart data={hiringTrends}>
            <defs>
              <linearGradient id="jobs" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.55} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Area type="monotone" dataKey="jobs" stroke="#14b8a6" fill="url(#jobs)" strokeWidth={2} />
          </AreaChart>
        </ChartCard>
        <ChartCard title="Headcount Distribution">
          <BarChart data={headcountDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" radius={[5, 5, 0, 0]} fill="#f59e0b" />
          </BarChart>
        </ChartCard>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <Badge tone="teal">AI monitored</Badge>
        </CardHeader>
        <div className="grid gap-3 md:grid-cols-3">
          {aiInsights.slice(0, 3).map((item) => (
            <div key={item.title} className="rounded-lg border border-border bg-muted/25 p-4">
              <Badge tone="orange">{item.impact}</Badge>
              <h3 className="mt-3 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
