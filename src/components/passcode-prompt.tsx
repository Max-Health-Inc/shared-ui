import { useState, type ReactNode } from "react"
import { Lock } from "lucide-react"
import { Button } from "./button"
import { Input } from "./input"
import { useUiText, type TFn } from "../lib/ui-text"

export interface PasscodePromptProps {
  /** What the protected thing is called, e.g. a share link's label. */
  label?: string
  /** What unlocking opens, e.g. "Enter the passcode to view the study." */
  description: ReactNode
  onSubmit: (passcode: string) => void
  t?: TFn
}

/** Asks for the passcode a protected link needs; the caller decides what a wrong one means. */
export function PasscodePrompt({ label, description, onSubmit, t: appT }: PasscodePromptProps) {
  const t = useUiText(appT)
  const [passcode, setPasscode] = useState("")

  return (
    <div data-slot="passcode-prompt" className="flex flex-col items-center justify-center py-24 gap-6 max-w-sm mx-auto px-4">
      <Lock className="size-12 text-muted-foreground" />
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">{t("Passcode Required")}</h2>
        {label && <p className="text-muted-foreground">{label}</p>}
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <form
        className="w-full space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(passcode)
        }}
      >
        <Input
          type="password"
          value={passcode}
          onChange={(event) => { setPasscode(event.target.value) }}
          placeholder={t("Enter passcode")}
          aria-label={t("Enter passcode")}
          autoComplete="off"
          autoFocus
        />
        <Button type="submit" className="w-full" disabled={passcode === ""}>
          {t("Unlock")}
        </Button>
      </form>
    </div>
  )
}
