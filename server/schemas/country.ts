import {z} from 'zod';

export const CountrySchema = z.object({
  country:z.string().min(1).max(100).trim(),
});
export type CountryParams = z.infer<typeof CountrySchema>;