"use client"

import { useFormContext } from "react-hook-form"
import type { CaseData } from "@/lib/schema"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldRow } from "../field-row"

export function Step1() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CaseData>()
  const sex = watch("sex")
  const bmi = watch("bmi")

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">General & Patient Details</h2>
        <p className="text-sm text-muted-foreground">Procedure and patient demographics.</p>
      </header>

      <FieldRow
        label="Procedure Date"
        htmlFor="procedure_date"
        required
        error={errors.procedure_date?.message}
      >
        <Input id="procedure_date" type="date" {...register("procedure_date")} />
      </FieldRow>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FieldRow label="Patient Name" htmlFor="patient_name" required error={errors.patient_name?.message}>
          <Input id="patient_name" {...register("patient_name")} placeholder="Full name" />
        </FieldRow>

        <FieldRow label="Sex" required error={errors.sex?.message}>
          <Select value={sex} onValueChange={(v) => setValue("sex", v as "Male" | "Female", { shouldValidate: true })}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>

        <FieldRow label="Age" htmlFor="age" required error={errors.age?.message}>
          <Input id="age" type="number" inputMode="numeric" min={0} {...register("age")} placeholder="Years" />
        </FieldRow>

        <FieldRow
          label="Medical Record Number"
          htmlFor="medical_record_number"
          required
          error={errors.medical_record_number?.message}
        >
          <Input id="medical_record_number" {...register("medical_record_number")} placeholder="MRN" />
        </FieldRow>

        <FieldRow label="Room" htmlFor="room" required error={errors.room?.message}>
          <Input id="room" {...register("room")} placeholder="e.g. OT-4" />
        </FieldRow>

        <FieldRow label="Weight (kg)" htmlFor="weight_kg" required error={errors.weight_kg?.message}>
          <Input
            id="weight_kg"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            {...register("weight_kg")}
            placeholder="kg"
          />
        </FieldRow>

        <FieldRow label="Height (cm)" htmlFor="height_cm" required error={errors.height_cm?.message}>
          <Input
            id="height_cm"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            {...register("height_cm")}
            placeholder="cm"
          />
        </FieldRow>

        <FieldRow label="BMI" htmlFor="bmi" hint="Auto-calculated from weight & height">
          <Input
            id="bmi"
            readOnly
            value={bmi !== undefined && bmi !== null && !Number.isNaN(bmi) ? String(bmi) : ""}
            className="bg-muted font-medium"
            placeholder="—"
          />
        </FieldRow>
      </div>
    </div>
  )
}
