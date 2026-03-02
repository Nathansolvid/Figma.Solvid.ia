import { Card, CardContent } from "@/app/components/ui/card";
import { LucideIcon } from "lucide-react";
import { CalculationTransparency } from "@/app/components/CalculationTransparency";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  indicatorCode?: string;
  posture?: 'conseil' | 'pre-audit' | 'audit-externe';
}

export function StatCard({ title, value, icon: Icon, trend, subtitle, indicatorCode, posture = 'conseil' }: StatCardProps) {
  // Extraire la valeur numérique pour le drawer de transparence
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/\s/g, '').replace(',', '.')) : value;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-semibold text-foreground">{value}</p>
              {indicatorCode && !isNaN(numericValue) && (
                <CalculationTransparency 
                  indicatorCode={indicatorCode}
                  displayedValue={numericValue}
                  posture={posture}
                  size="sm"
                />
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && (
              <p className={`text-sm mt-2 ${trend.isPositive ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </p>
            )}
          </div>
          <div className="bg-[#E8F3F0] p-3 rounded-lg">
            <Icon className="h-6 w-6 text-[#0F4C3A]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}