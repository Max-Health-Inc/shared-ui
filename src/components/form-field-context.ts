import * as React from "react"

export interface FormFieldControl {
  id: string
  describedBy?: string
  invalid: boolean
  required?: boolean
}

export const FormFieldContext = React.createContext<FormFieldControl | null>(null)

type ControlProps = Pick<React.ComponentProps<"input">, "id" | "required" | "aria-describedby" | "aria-invalid">

/** Wires a control to its enclosing FormField: id, description/error, invalid and required. */
export function useFormFieldControl<P extends ControlProps>(props: P): P {
  const field = React.useContext(FormFieldContext)
  if (!field) return props
  const describedBy = [field.describedBy, props["aria-describedby"]].filter(Boolean).join(" ")
  return {
    ...props,
    id: props.id ?? field.id,
    required: props.required ?? field.required,
    "aria-invalid": props["aria-invalid"] ?? (field.invalid || undefined),
    "aria-describedby": describedBy || undefined,
  }
}
