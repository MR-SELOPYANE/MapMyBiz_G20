/**
 * @file Application constants.
 * @description Centralised lists of South African provinces, business
 * categories, learning modules, and shared colour tokens.
 */

import { COURSES } from "../data/courses.js";

/**
 * South African provinces.
 *
 * @type {Array<{ code: string, name: string, capital?: string }>}
 */
export const SA_PROVINCES = [
  { code: "EC", name: "Eastern Cape", capital: "Bhisho" },
  { code: "FS", name: "Free State", capital: "Bloemfontein" },
  { code: "GT", name: "Gauteng", capital: "Pretoria" },
  { code: "KZN", name: "KwaZulu-Natal", capital: "Pietermaritzburg" },
  { code: "LP", name: "Limpopo", capital: "Polokwane" },
  { code: "MP", name: "Mpumalanga", capital: "Mbombela" },
  { code: "NC", name: "Northern Cape", capital: "Kimberley" },
  { code: "NW", name: "North West", capital: "Mahikeng" },
  { code: "WC", name: "Western Cape", capital: "Cape Town" },
];

/**
 * Business categories used across the map and business listing features.
 * Mirrors the categories in the Leaflet map control panel.
 *
 * @type {Array<{ value: string, label: string, emoji: string, color: string }>}
 */
export const BUSINESS_CATEGORIES = [
  { value: "food", label: "Food & Eats", emoji: "🍽️", color: "#e11d48" },
  { value: "shops", label: "Local Shops", emoji: "🛍️", color: "#2563eb" },
  { value: "crafts", label: "Crafts & Artisans", emoji: "🎨", color: "#16a34a" },
  { value: "nature", label: "Nature & Outdoors", emoji: "🏞️", color: "#ea580c" },
  { value: "services", label: "Services", emoji: "🧑‍🔧", color: "#6a0dad" },
  { value: "tourism", label: "Tourism & Experiences", emoji: "👣", color: "#d4af37" },
  { value: "retail", label: "Retail & Clothing", emoji: "👔", color: "#64748b" },
  { value: "Consulting", label: "Consulting", emoji: "💼", color: "#3730a3" },
  { value: "Restaurant", label: "Restaurant", emoji: "🍴", color: "#ea580c" },
  { value: "Retail Shop", label: "Retail Shop", emoji: "🏪", color: "#0ea5e9" },
  { value: "Salon & Beauty", label: "Salon & Beauty", emoji: "💇", color: "#db27b8" },
  { value: "Tech Services", label: "Tech Services", emoji: "💻", color: "#2563eb" },
  { value: "Agriculture", label: "Agriculture", emoji: "🌾", color: "#16a34a" },
  { value: "Other", label: "Other", emoji: "🔹", color: "#64748b" },
];

/**
 * Job categories for the collaboration board.
 *
 * @type {string[]}
 */
export const JOB_CATEGORIES = [
  "Technology",
  "Tourism & Hospitality",
  "Retail & E-commerce",
  "Food & Beverage",
  "Construction & Trades",
  "Healthcare & Wellness",
  "Education & Training",
  "Creative Arts",
  "Agriculture",
  "Finance & Consulting",
  "Transport & Logistics",
  "Other",
];

/**
 * Job types available on the collaboration board.
 *
 * @type {string[]}
 */
export const JOB_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
];

/**
 * Learning modules available in the platform (15 modules).
 *
 * @type {Array<{ id: string, title: string, path: string }>}
 */
export const LEARNING_MODULES = COURSES.map((course) => ({
  id: String(course.id),
  title: course.title,
  path: `/module/${course.id}`,
}));

/** Total number of learning modules. */
export const TOTAL_MODULES = LEARNING_MODULES.length;

/**
 * Shared colour palette.
 *
 * @type {Object<string, string>}
 */
export const COLORS = {
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  secondary: "#ea580c",
  success: "#16a34a",
  warning: "#ca8a04",
  error: "#dc2626",
  info: "#0ea5e9",
  light: "#f8fafc",
  dark: "#0f172a",
  gray: "#64748b",
  grayLight: "#e2e8f0",
  youth: "#16a34a",
  gold: "#d4af37",
};

export default {
  SA_PROVINCES,
  BUSINESS_CATEGORIES,
  JOB_CATEGORIES,
  JOB_TYPES,
  LEARNING_MODULES,
  TOTAL_MODULES,
  COLORS,
};
