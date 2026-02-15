import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { uploadSingleBill } from "../middleware/multer.middleware";
import { addManualExpense, listBills, listCategories, listExpenses, uploadBill } from "../controllers/bills.controller";
import { createManualExpenseSchema } from "../validators/bills.validators";

const router = Router();

router.use(authenticate);

router.get("/categories", listCategories);
router.post("/upload", uploadSingleBill, uploadBill);
router.get("/", listBills);
router.post("/manual", validateBody(createManualExpenseSchema), addManualExpense);
router.get("/expenses", listExpenses);

export default router;