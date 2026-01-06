import { z } from "zod";

export const IdSchema = z.string().min(1);
export const DirectionSchema = z.enum(["expense", "income"]);
export const FrequencySchema = z.enum(["monthly"]);

export const OccurredAtSchema = z.coerce.date();
