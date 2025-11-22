import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ProfileStatsCardProps {
  icon: LucideIcon;
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  gradient?: string;
}

export function ProfileStatsCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  gradient = 'from-primary to-accent',
}: ProfileStatsCardProps) {
  return (
    <Card className="hover-lift hover-scale cursor-pointer border-border/50 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {trend && (
            <div className={`text-body-sm font-semibold ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <div className="text-heading-2 font-bold text-foreground">{value}</div>
          <div className="text-body-sm font-medium text-muted-foreground">{title}</div>
          {subtitle && (
            <div className="text-ui-caption text-muted-foreground">{subtitle}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
