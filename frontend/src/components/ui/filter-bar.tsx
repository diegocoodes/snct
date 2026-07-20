import { SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

function FilterBar({
  className,
  children,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      aria-label="Filtros"
      className={cn(
        "surface-glass flex flex-col gap-3 rounded-2xl p-3 md:flex-row md:items-center",
        className,
      )}
      {...props}
    >
      <span className="flex shrink-0 items-center gap-2 px-1 text-sm font-medium text-muted-foreground">
        <SlidersHorizontal aria-hidden className="size-4" />
        Filtros
      </span>
      {children}
    </section>
  );
}

export { FilterBar };
