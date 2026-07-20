import { useId } from "react";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

type FormFieldProps = React.ComponentProps<typeof Field> & {
  id?: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
};

function FormField({
  id,
  label,
  description,
  error,
  required,
  children,
  ...props
}: FormFieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;

  return (
    <Field data-invalid={Boolean(error)} {...props}>
      <FieldLabel htmlFor={controlId}>
        {label}
        {required && (
          <span className="text-error" aria-hidden>
            *
          </span>
        )}
      </FieldLabel>
      {children}
      {description && (
        <FieldDescription id={`${controlId}-description`}>
          {description}
        </FieldDescription>
      )}
      {error && <FieldError id={`${controlId}-error`}>{error}</FieldError>}
    </Field>
  );
}

export { FormField, type FormFieldProps };
