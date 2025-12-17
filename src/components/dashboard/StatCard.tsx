import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-card',
    success: 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20',
    warning: 'bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20',
    danger: 'bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20',
  };

  const iconStyles = {
    default: 'bg-muted/50 text-muted-foreground',
    success: 'bg-primary/20 text-primary',
    warning: 'bg-amber-500/20 text-amber-600',
    danger: 'bg-destructive/20 text-destructive',
  };

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg", iconStyles[variant])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <p className={cn(
            "text-xs font-medium mt-2 flex items-center gap-1",
            trend.isPositive ? "text-primary" : "text-destructive"
          )}>
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            {Math.abs(trend.value)}% from yesterday
          </p>
        )}
      </CardContent>
    </Card>
  );
}
