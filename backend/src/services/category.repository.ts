import { Category, ICategory } from "../models/Category";

interface DefaultCategoryInput {
  name: string;
  keywords: string;
}

export const upsertDefaultCategories = async (defaults: DefaultCategoryInput[]): Promise<void> => {
  await Promise.all(
    defaults.map((item) =>
      Category.updateOne(
        { name: item.name },
        { $set: { keywords: item.keywords } },
        { upsert: true }
      )
    )
  );
};

export const findAllCategories = async (): Promise<ICategory[]> => {
  return Category.find({}).sort({ name: 1 });
};

export const findCategoryByName = async (name: string): Promise<ICategory | null> => {
  return Category.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
};

export const findCategoryById = async (categoryId: string): Promise<ICategory | null> => {
  return Category.findById(categoryId);
};
