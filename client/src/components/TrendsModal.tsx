import { useQuery } from "@tanstack/react-query";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, TrendingUp, Code2, Globe } from "lucide-react";
import { motion } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";

// Brand-aligned Cyberpunk/Modern Palette
const COLORS = [
    '#8b5cf6', // Violet
    '#0ea5e9', // Blue
    '#ec4899', // Pink
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#6366f1', // Indigo
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

interface TrendsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function TrendsModal({ open, onOpenChange }: TrendsModalProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['/api/stats'],
        retry: false,
        enabled: open
    }) as { data: any, isLoading: boolean };

    // Formatter for large numbers (e.g. 1,200)
    const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-8 py-4">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                    </div>
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                </div>
            );
        }

        const stats = data?.data || {};
        const totalGenerations = stats.totalGenerated || 0;

        const frameworkData = stats.byFramework?.map((f: any) => ({
            name: f.framework,
            value: parseInt(f.count)
        })) || [];

        const languageData = stats.byLanguage?.map((l: any) => ({
            name: l.language,
            value: parseInt(l.count)
        })) || [];

        const typeData = stats.byTestingType?.map((t: any) => ({
            name: t.testingType.toUpperCase(),
            value: parseInt(t.count)
        })) || [];

        const CustomTooltip = ({ active, payload, label }: any) => {
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
            <motion.div
                className="space-y-8 py-2"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {/* KPI Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <motion.div variants={item}>
                        <Card className="overflow-hidden relative border-primary/10 dark:border-primary/20 bg-gradient-to-br from-card to-primary/5">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <RefreshCw className="w-24 h-24 text-primary" />
                            </div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
                                <RefreshCw className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold tracking-tight text-foreground">{formatNumber(totalGenerations)}</div>
                                <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center gap-1">
                                    <span className="text-green-500">Live</span> generated & counting
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={item}>
                        <Card className="group hover:border-violet-500/50 transition-colors duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Top Language</CardTitle>
                                <Code2 className="h-4 w-4 text-violet-500 group-hover:scale-110 transition-transform" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold capitalize">{languageData[0]?.name || '-'}</div>
                                <p className="text-xs text-muted-foreground mt-1">Community Favorite</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={item}>
                        <Card className="group hover:border-pink-500/50 transition-colors duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Top Framework</CardTitle>
                                <TrendingUp className="h-4 w-4 text-pink-500 group-hover:scale-110 transition-transform" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold capitalize">{frameworkData[0]?.name || '-'}</div>
                                <p className="text-xs text-muted-foreground mt-1">Most Selected</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={item}>
                        <Card className="group hover:border-blue-500/50 transition-colors duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Primary Focus</CardTitle>
                                <Globe className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-wrap truncate" title={typeData[0]?.name}>{typeData[0]?.name || '-'}</div>
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
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={frameworkData} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={100}
                                            tick={{ fontSize: 13, fill: '#888888', fontWeight: 500 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--primary)', opacity: 0.05 }} />
                                        <Bar
                                            dataKey="value"
                                            radius={[0, 6, 6, 0]}
                                            barSize={32}
                                            animationDuration={1500}
                                        >
                                            {frameworkData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
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
                                            {languageData.map((entry: any, index: number) => (
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
                                                    {payload?.map((entry: any, index: number) => (
                                                        <div key={`legend-${index}`} className="flex items-center gap-2">
                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                                            <span className="text-sm font-medium text-muted-foreground capitalize">{entry.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
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
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={typeData} margin={{ top: 20, bottom: 20 }}>
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 13, fill: '#888888', fontWeight: 500 }}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--primary)', opacity: 0.05 }} />
                                        <Bar
                                            dataKey="value"
                                            radius={[8, 8, 0, 0]}
                                            barSize={60}
                                            animationDuration={1500}
                                        >
                                            {typeData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
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
                        <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 bg-clip-text text-transparent">
                            Global QA Trends
                        </span>
                    </DialogTitle>
                    <DialogDescription className="text-lg text-muted-foreground font-medium">
                        Real-time adoption metrics from the global QAStarter community.
                    </DialogDescription>
                </DialogHeader>

                {renderContent()}
            </DialogContent>
        </Dialog>
    );
}
