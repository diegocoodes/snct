import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles = {
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  error: "border-error/30 bg-error/10 text-error",
  info: "border-cyan-electric/30 bg-cyan-electric/10 text-cyan-electric",
  neutral: "border-border bg-muted/10 text-muted-foreground",
} as const;

const defaultLabels = {
  success: "Concluído",
  warning: "Atenção",
  error: "Erro",
  info: "Informação",
  neutral: "Pendente",
} as const;

type StatusBadgeProps = Omit<React.ComponentProps<typeof Badge>, "variant"> & {
  status?: keyof typeof statusStyles;
};

function StatusBadge({
  status = "neutral",
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-display tracking-wide",
        statusStyles[status],
        className,
      )}
      {...props}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children ?? defaultLabels[status]}
    </Badge>
  );
}

export { StatusBadge, type StatusBadgeProps };
