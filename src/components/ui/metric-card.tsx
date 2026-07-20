import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = React.ComponentProps<typeof Card> & {
  label: string;
  value: ReactNode;
  description?: string;
  icon?: ReactNode;
  trend?: ReactNode;
};

function MetricCard({
  label,
  value,
  description,
  icon,
  trend,
  className,
  ...props
}: MetricCardProps) {
  return (
    <Card className={cn("relative isolate", className)} {...props}>
      <div
        aria-hidden
        className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-electric/65 to-transparent"
      />
      <CardHeader className="flex-row items-start justify-between">
        <div className="space-y-1">
          <CardTitle className="font-sans text-sm text-muted-foreground">
            {label}
          </CardTitle>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {icon && (
          <span className="grid size-10 place-items-center rounded-xl bg-cyan-electric/10 text-cyan-electric">
            {icon}
          </span>
        )}
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-4">
        <p className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
        {trend && <div className="text-xs text-muted-foreground">{trend}</div>}
      </CardContent>
    </Card>
  );
}

export { MetricCard, type MetricCardProps };
