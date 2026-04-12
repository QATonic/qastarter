import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  type TooltipProps,
} from 'recharts';

/** Shape of a single data point used in all Recharts charts. */
interface ChartDatum {
  name: string;
  value: number;
}

/** API response shape for analytics stats. */
interface StatsResponse {
  data: {
    totalGenerated: number;
    byFramework: { framework: string; count: number | string }[];
    byLanguage: { language: string; count: number | string }[];
    byTestingType: { testingType: string; count: number | string }[];
  };
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, TrendingUp, Code2, Globe } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// Chart colors wired to the CSS design token system.
// These values are read once at render time; they adapt to light/dark mode
// via the CSS custom properties defined in index.css.
function getChartColors(): string[] {
  if (typeof window === 'undefined') {
    // SSR fallback
    return ['#8b5cf6', '#0ea5e9', '#ec4899', '#10b981', '#f59e0b', '#6366f1'];
  }
  const style = getComputedStyle(document.documentElement);
  const resolve = (name: string, fallback: string) => {
    const raw = style.getPropertyValue(name).trim();
    return raw ? `hsl(${raw})` : fallback;
  };
  return [
    resolve('--chart-1', '#8b5cf6'),
    resolve('--chart-2', '#0ea5e9'),
    resolve('--chart-3', '#ec4899'),
    resolve('--chart-4', '#10b981'),
    resolve('--chart-5', '#f59e0b'),
    resolve('--chart-1', '#6366f1'), // cycle back for 6th
  ];
}

function getAxisColor(): string {
  if (typeof window === 'undefined') return '#888888';
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--muted-foreground')
    .trim();
  return raw ? `hsl(${raw})` : '#888888';
}

interface TrendsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Screen-reader-only data table fallback for chart data */
function SrDataTable({ data, label }: { data: { name: string; value: number }[]; label: string }) {
  if (!data.length) return null;
  return (
    <table className="sr-only" aria-label={label}>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Count</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d) => (
          <tr key={d.name}>
            <td>{d.name}</td>
            <td>{d.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function TrendsModal({ open, onOpenChange }: TrendsModalProps) {
  const prefersReducedMotion = useReducedMotion();

  const { data, isLoading } = useQuery({
    queryKey: ['/api/v1/analytics/stats'],
    retry: false,
    enabled: open,
    staleTime: 2 * 60 * 1000, // 2 minutes — avoid re-fetching on every open
  }) as { data: StatsResponse | undefined; isLoading: boolean };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: prefersReducedMotion ? { duration: 0 } : { staggerChildren: 0.1 },
    },
  };

  const item = prefersReducedMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const animationDuration = prefersReducedMotion ? 0 : 1500;

  // Formatter for large numbers (e.g. 1,200)
  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-8 py-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      );
    }

    const COLORS = getChartColors();
    const axisColor = getAxisColor();

    const stats = data?.data || {};
    const totalGenerations = stats.totalGenerated || 0;

    const frameworkData: ChartDatum[] =
      stats.byFramework?.map((f) => ({
        name: f.framework,
        value: Number(f.count) || 0,
      })) || [];

    const languageData: ChartDatum[] =
      stats.byLanguage?.map((l) => ({
        name: l.language,
        value: Number(l.count) || 0,
      })) || [];

    const typeData: ChartDatum[] =
      stats.byTestingType?.map((t) => ({
        name: (t.testingType || '').toUpperCase(),
        value: Number(t.count) || 0,
      })) || [];

    const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-background/95 border border-border/50 p-3 rounded-xl shadow-xl backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10">
            <p className="font-semibold text-foreground mb-1">{label}</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                {formatNumber(payload[0].value)} Projects
              </p>
            </div>
          </div>
        );
      }
      return null;
    };

    return (
      <motion.div className="space-y-8 py-2" variants={container} initial="hidden" animate="show">
        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={item}>
            <Card className="overflow-hidden relative border-primary/10 dark:border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <RefreshCw className="w-24 h-24 text-primary" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Projects
                </CardTitle>
                <RefreshCw className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold tracking-tight text-foreground">
                  {formatNumber(totalGenerations)}
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">
                  Generated &amp; counting
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="transition-colors duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Language
                </CardTitle>
                <Code2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold capitalize">{languageData[0]?.name || '-'}</div>
                <p className="text-xs text-muted-foreground mt-1">Community Favorite</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="transition-colors duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Framework
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-pink-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold capitalize">{frameworkData[0]?.name || '-'}</div>
                <p className="text-xs text-muted-foreground mt-1">Most Selected</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="transition-colors duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Primary Focus
                </CardTitle>
                <Globe className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-wrap truncate" title={typeData[0]?.name}>
                  {typeData[0]?.name || '-'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Testing Type</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Framework Popularity */}
          <motion.div variants={item} className="col-span-1">
            <Card className="h-full border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader>
                <CardTitle>Framework Popularity</CardTitle>
                <CardDescription>Tools chosen by engineers worldwide</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {frameworkData.length > 0 ? (
                  <>
                    <SrDataTable data={frameworkData} label="Framework popularity data" />
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={frameworkData}
                        layout="vertical"
                        margin={{ left: 20, right: 30, top: 10, bottom: 10 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={100}
                          tick={{ fontSize: 13, fill: axisColor, fontWeight: 500 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
                        />
                        <Bar
                          dataKey="value"
                          radius={[0, 6, 6, 0]}
                          barSize={32}
                          animationDuration={animationDuration}
                        >
                          {frameworkData.map((_entry: ChartDatum, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <TrendingUp className="w-8 h-8 text-primary/50" />
                    </div>
                    <p className="text-muted-foreground font-medium">No data yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Generate your first project to see trends!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Language Distribution */}
          <motion.div variants={item} className="col-span-1">
            <Card className="h-full border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader>
                <CardTitle>Language Distribution</CardTitle>
                <CardDescription>Preferred ecosystem breakdown</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {languageData.length > 0 ? (
                  <>
                    <SrDataTable data={languageData} label="Language distribution data" />
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={languageData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {languageData.map((_entry: ChartDatum, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                          content={({ payload }) => (
                            <div className="flex flex-wrap justify-center gap-4 mt-4">
                              {payload?.map((entry, index: number) => (
                                <div key={`legend-${index}`} className="flex items-center gap-2">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-sm font-medium text-muted-foreground capitalize">
                                    {entry.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Code2 className="w-8 h-8 text-primary/50" />
                    </div>
                    <p className="text-muted-foreground font-medium">No languages yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Be the first to generate a project!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Testing Type Distribution - Full Width */}
          <motion.div variants={item} className="col-span-1 md:col-span-2">
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader>
                <CardTitle>Testing Strategy Distribution</CardTitle>
                <CardDescription>What are teams testing the most?</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                {typeData.length > 0 ? (
                  <>
                    <SrDataTable data={typeData} label="Testing strategy distribution data" />
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={typeData} margin={{ top: 20, bottom: 20 }}>
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 13, fill: axisColor, fontWeight: 500 }}
                          axisLine={false}
                          tickLine={false}
                          dy={10}
                        />
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
                        />
                        <Bar
                          dataKey="value"
                          radius={[8, 8, 0, 0]}
                          barSize={60}
                          animationDuration={animationDuration}
                        >
                          {typeData.map((_entry: ChartDatum, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Globe className="w-8 h-8 text-primary/50" />
                    </div>
                    <p className="text-muted-foreground font-medium">No testing data yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Community trends will appear here as projects are generated
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader className="space-y-2 pb-6 border-b border-border/40">
          <DialogTitle className="text-4xl font-black tracking-tighter">
            <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
              Global QA Trends
            </span>
          </DialogTitle>
          <DialogDescription className="text-lg text-muted-foreground font-medium">
            Adoption metrics from the QAStarter community.
          </DialogDescription>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
