import * as React from "react"
import { cn } from "../lib/utils"
import { FormFieldContext, type FormFieldControl } from "./form-field-context"

function FormRoot({
  className,
  children,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form
      data-slot="form"
      noValidate
      className={cn(className)}
      {...props}
    >
      {children}
    </form>
  )
}

interface FormFieldProps extends React.ComponentProps<"div"> {
  label?: string
  /** Id for the control; generated when omitted. */
  name?: string
  required?: boolean
  description?: string
  error?: string
}

function FormField({
  label,
  name,
  required,
  description,
  error,
  className,
  children,
  ...props
}: FormFieldProps) {
  const generatedId = React.useId()
  const id = name ?? generatedId
  const errorId = `${id}-error`
  const descriptionId = `${id}-description`
  const control = React.useMemo<FormFieldControl>(() => ({
    id,
    describedBy: error ? errorId : description ? descriptionId : undefined,
    invalid: Boolean(error),
    required,
  }), [id, error, errorId, description, descriptionId, required])

  return (
    <FormFieldContext.Provider value={control}>
      <div
        data-slot="form-field"
        className={cn("space-y-2", className)}
        {...props}
      >
        {label && (
          <label
            htmlFor={id}
            className="block text-xs text-foreground/50 mb-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {required && <span aria-hidden="true" className="ml-1 text-destructive">*</span>}
          </label>
        )}
        {children}
        {description && !error && (
          <p id={descriptionId} className="text-xs text-foreground/50">
            {description}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    </FormFieldContext.Provider>
  )
}

function FormError({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  if (!children) return null
  return (
    <p
      data-slot="form-error"
      role="alert"
      className={cn("text-xs text-destructive", className)}
      {...props}
    >
      {children}
    </p>
  )
}

function FormActions({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-actions"
      className={cn("flex items-center justify-end gap-3 pt-4", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { FormRoot as Form, FormField, FormError, FormActions }
