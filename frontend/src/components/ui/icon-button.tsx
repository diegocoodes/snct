import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

type IconButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "children" | "aria-label"
> & {
  "aria-label": string;
  children: ReactNode;
};

function IconButton({ children, size = "icon", ...props }: IconButtonProps) {
  return (
    <Button size={size} {...props}>
      {children}
    </Button>
  );
}

export { IconButton, type IconButtonProps };
