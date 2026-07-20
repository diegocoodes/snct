"use client";

import type { ChangeEventHandler } from "react";

import { Input } from "@/components/ui/input";
import { formatCpf, formatPhone } from "@/lib/masks";

type MaskKind = "cpf" | "phone";

type InputMaskProps = Omit<React.ComponentProps<typeof Input>, "onChange"> & {
  mask: MaskKind;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

function InputMask({ mask, onChange, ...props }: InputMaskProps) {
  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    event.currentTarget.value =
      mask === "cpf"
        ? formatCpf(event.currentTarget.value)
        : formatPhone(event.currentTarget.value);
    onChange?.(event);
  };

  return (
    <Input
      inputMode="numeric"
      autoComplete={mask === "phone" ? "tel" : "off"}
      onChange={handleChange}
      {...props}
    />
  );
}

export { InputMask, type InputMaskProps, type MaskKind };
