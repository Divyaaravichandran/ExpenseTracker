import { ICategory } from "../models/Category";
import { findAllCategories, upsertDefaultCategories } from "./category.repository";

const DEFAULT_CATEGORIES = [
  { name: "Food", keywords: "food,dining,restaurant,grocery" },
  { name: "Shopping", keywords: "shopping,clothes,retail" },
  { name: "Utilities", keywords: "electricity,water,internet,utility" },
  { name: "Travel", keywords: "travel,flight,hotel,taxi" },
  { name: "Entertainment", keywords: "movies,games,streaming,entertainment" },
  { name: "Other", keywords: "other,misc" },
  { name: "Fuel", keywords: "fuel,petrol,gas" }
] as const;

export const ensureDefaultCategories = async (): Promise<void> => {
  await upsertDefaultCategories([...DEFAULT_CATEGORIES]);
};

export const getCategories = async (): Promise<ICategory[]> => {
  return findAllCategories();
};