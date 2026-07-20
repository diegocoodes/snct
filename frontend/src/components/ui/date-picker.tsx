"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

function DatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  disabled,
  className,
  "aria-label": ariaLabel = "Selecionar data",
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start font-normal",
              !value && "text-muted-foreground",
              className,
            )}
            aria-label={ariaLabel}
          />
        }
      >
        <CalendarDays aria-hidden data-icon="inline-start" />
        {value ? format(value, "PPP", { locale: ptBR }) : placeholder}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          locale={ptBR}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker, type DatePickerProps };
