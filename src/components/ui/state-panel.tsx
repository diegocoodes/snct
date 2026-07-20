"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox, LoaderCircle, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StatePanelProps = React.ComponentProps<"section"> & {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "neutral" | "error" | "warning";
};

function StatePanel({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  tone = "neutral",
  className,
  ...props
}: StatePanelProps) {
  return (
    <section
      className={cn(
        "surface-glass flex min-h-56 flex-col items-center justify-center rounded-2xl p-6 text-center",
        tone === "error" && "border-error/25",
        tone === "warning" && "border-warning/25",
        className,
      )}
      aria-live={tone === "error" ? "assertive" : "polite"}
      {...props}
    >
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-cyan-electric/10 text-cyan-electric">
        <Icon aria-hidden className="size-6" />
      </span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button className="mt-5" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </section>
  );
}

function EmptyState(props: Omit<StatePanelProps, "icon">) {
  return <StatePanel icon={Inbox} {...props} />;
}

function ErrorState(props: Omit<StatePanelProps, "icon" | "tone">) {
  return <StatePanel icon={AlertTriangle} tone="error" {...props} />;
}

function OfflineState(props: Omit<StatePanelProps, "icon" | "tone">) {
  return <StatePanel icon={WifiOff} tone="warning" {...props} />;
}

function LoadingState({ label = "Carregando" }: { label?: string }) {
  return (
    <div
      className="flex min-h-32 items-center justify-center gap-3 text-sm text-muted-foreground"
      role="status"
    >
      <LoaderCircle
        aria-hidden
        className="size-5 animate-spin text-cyan-electric motion-reduce:animate-none"
      />
      <span>{label}</span>
    </div>
  );
}

export { EmptyState, ErrorState, LoadingState, OfflineState, StatePanel };
export type { StatePanelProps };
