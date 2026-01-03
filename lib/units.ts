const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;
const GRAMS_PER_KG = 1000;
const KG_PER_LB = 0.453592;

export type MeasurementSystem = 'metric' | 'imperial';

export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    age--;
  }
  return age;
}

export type FeetInches = { feet: number; inches: number };

export function cmToFeetInches(cm: number): FeetInches {
  const totalInches = cm / CM_PER_INCH;
  const feet = Math.floor(totalInches / INCHES_PER_FOOT);
  const inches = Math.round(totalInches % INCHES_PER_FOOT);
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = feet * INCHES_PER_FOOT + inches;
  return Math.round(totalInches * CM_PER_INCH);
}

export const gramsToKg = (grams: number) =>
  Math.round((grams / GRAMS_PER_KG) * 10) / 10;
export const kgToGrams = (kg: number) => Math.round(kg * GRAMS_PER_KG);
export const kgToLbs = (kg: number) => Math.round((kg / KG_PER_LB) * 10) / 10;
export const lbsToKg = (lbs: number) => Math.round(lbs * KG_PER_LB * 10) / 10;

export function convertWeightBetweenSystems(
  value: number,
  from: MeasurementSystem,
  to: MeasurementSystem,
): number {
  if (from === to) return value;
  if (to === 'imperial') return kgToLbs(value);
  return lbsToKg(value);
}
