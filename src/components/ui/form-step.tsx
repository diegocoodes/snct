import { cn } from "@/lib/utils";

type FormStepProps = React.ComponentProps<"section"> & {
  step: number;
  title: string;
  description?: string;
};

function FormStep({
  step,
  title,
  description,
  className,
  children,
  ...props
}: FormStepProps) {
  return (
    <section
      className={cn("space-y-6", className)}
      aria-labelledby={`form-step-${step}`}
      {...props}
    >
      <header className="flex gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-cyan-electric/25 bg-cyan-electric/10 font-display text-sm text-cyan-electric">
          {String(step).padStart(2, "0")}
        </span>
        <div>
          <h2
            id={`form-step-${step}`}
            className="font-display text-xl font-semibold"
          >
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}

export { FormStep, type FormStepProps };
