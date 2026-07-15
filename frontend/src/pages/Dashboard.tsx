import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Globe, Clock, Award, History, TrendingUp, HelpCircle, 
  ChevronRight, Bookmark, ArrowUpRight, BarChart3
} from 'lucide-react';
import { api } from '../utils/api';
import type { DashboardStats } from '../utils/api';

interface DashboardProps {
  statsTrigger: number; // Increment this to force reload stats
}

export const Dashboard: React.FC<DashboardProps> = ({ statsTrigger }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const COLORS = ['#6366F1', '#7C3AED', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444'];

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.fetchStats();
        setStats(data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load dashboard metrics. Ensure the backend is active.');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [statsTrigger]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto w-full px-4 py-12 flex flex-col gap-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-danger/10 text-danger flex items-center justify-center shadow-sm">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Dashboard Unreachable
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          {error || 'No statistics are available at this time.'}
        </p>
      </div>
    );
  }

  const { summary, charts } = stats;

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
      
      {/* Dashboard Headline */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          Translation Insights
        </h2>
        <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold mt-1">
          Real-time analytics and translation history summary
        </p>
      </div>

      {/* 4 Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Translations */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-md flex items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total Requests
            </span>
            <span className="block text-3xl font-extrabold text-slate-800 dark:text-white mt-2">
              {summary.totalTranslations}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] text-success font-bold mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>Active Pipeline</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Voice input duration */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-md flex items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Voice Processed
            </span>
            <span className="block text-3xl font-extrabold text-slate-800 dark:text-white mt-2">
              {summary.totalDuration}s
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1 block">
              16kHz Resampled Mono
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Confidence Average */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-md flex items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Whisper Confidence
            </span>
            <span className="block text-3xl font-extrabold text-slate-800 dark:text-white mt-2">
              {summary.averageConfidence}%
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1 block">
              Average posterior accuracy
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Estimated Time Saved */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-md flex items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Time Saved
            </span>
            <span className="block text-3xl font-extrabold text-slate-800 dark:text-white mt-2">
              {summary.timeSavedMinutes}m
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1 block flex items-center gap-0.5">
              <span>vs manual lookup</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center">
            <Bookmark className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Translation Timeline (Spans 2 columns) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-md flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Weekly Pipeline Activity
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Daily translation volumes processed over the last 7 days
            </p>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.timeline}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(30, 41, 59, 0.9)', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="translations" 
                  stroke="#6366F1" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#6366F1' }} 
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Target Languages Pie (Spans 1 column) */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-md flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Target Language Focus
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Top language outputs from machine translation
            </p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {charts.popularLanguages.length === 0 ? (
              <span className="text-xs text-slate-450 dark:text-slate-500 font-semibold">No data logged yet</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.popularLanguages}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="language"
                  >
                    {charts.popularLanguages.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(30, 41, 59, 0.9)', 
                      border: 'none', 
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie Legends */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {charts.popularLanguages.map((item, index) => (
              <div key={item.language} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span>{item.language} ({item.count})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Popular Source Languages Bar Chart */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-md flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Detected Source Languages
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Distribution of language categories identified during speech recognition
          </p>
        </div>

        <div className="h-56 w-full">
          {charts.popularSources.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs text-slate-450 dark:text-slate-500 font-semibold">No speech logs available</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.popularSources}>
                <XAxis dataKey="language" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(30, 41, 59, 0.9)', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="count" fill="#7C3AED" radius={[8, 8, 0, 0]} maxBarSize={45}>
                  {charts.popularSources.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
};
