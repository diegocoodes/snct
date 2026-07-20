"use client";

import { Search, X } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputProps = React.ComponentProps<typeof Input> & {
  onClear?: () => void;
};

function SearchInput({
  className,
  onClear,
  value,
  ...props
}: SearchInputProps) {
  return (
    <div className="relative w-full">
      <Search
        aria-hidden
        className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={value}
        className={cn("pr-11 pl-10", className)}
        {...props}
      />
      {onClear && value && (
        <IconButton
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Limpar busca"
          className="absolute top-1/2 right-1 -translate-y-1/2"
          onClick={onClear}
        >
          <X />
        </IconButton>
      )}
    </div>
  );
}

export { SearchInput, type SearchInputProps };
