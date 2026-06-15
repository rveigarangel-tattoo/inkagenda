"use client"
import * as React from "react"
import { Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface CurrencyInputProps {
  control: any
  name: string
  className?: string
  placeholder?: string
}

export function CurrencyInput({ control, name, className, placeholder }: CurrencyInputProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const display =
          field.value === "" || field.value === undefined || field.value === null
            ? ""
            : new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
                Number(field.value)
              )
        return (
          <div className={cn("relative", className)}>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              R$
            </span>
            <Input
              inputMode="numeric"
              placeholder={placeholder ?? "0,00"}
              className="pl-9"
              value={display}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "")
                field.onChange(digits ? Number(digits) / 100 : 0)
              }}
            />
          </div>
        )
      }}
    />
  )
}
