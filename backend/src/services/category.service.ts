import { ICategory } from "../models/Category";
import { findAllCategories, upsertDefaultCategories } from "./category.repository";

const DEFAULT_CATEGORIES = [
  { name: "Food", keywords: "food,dining,restaurant,grocery" },
  { name: "Shopping", keywords: "shopping,clothes,retail" },
  { name: "Utilities", keywords: "electricity,water,internet,utility" },
  { name: "Travel", keywords: "travel,flight,hotel,taxi" },
  { name: "Entertainment", keywords: "movies,games,streaming,entertainment" },
  { name: "Education", keywords: "education,school,tuition,fees,college,university,academy,course,books" },
  { name: "Medical", keywords: "medical,hospital,clinic,doctor,pharmacy,medicine,diagnostic,lab,health" },
  { name: "Other", keywords: "other,misc" },
  { name: "Fuel", keywords: "fuel,petrol,gas" }
] as const;

export const ensureDefaultCategories = async (): Promise<void> => {
  await upsertDefaultCategories([...DEFAULT_CATEGORIES]);
};

export const getCategories = async (): Promise<ICategory[]> => {
  return findAllCategories();
};
