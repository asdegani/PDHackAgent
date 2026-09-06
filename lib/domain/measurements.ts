import { z } from "zod";

export const measurementSchema = z.object({
  name: z.enum(["left_knee_range", "right_knee_range", "knee_asymmetry"]),
  value: z.number().finite(),
  unit: z.enum(["degree", "percent"]),
});

export const measurementSummarySchema = z.object({
  capturedAt: z.string().datetime(),
  algorithmVersion: z.string().min(1),
  quality: z.number().min(0).max(1),
  values: z.array(measurementSchema).min(1),
});

export type MeasurementSummary = z.infer<typeof measurementSummarySchema>;
