import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { uploadSingleBill } from "../middleware/upload.middleware";
import { addManualExpense, listCategories, listExpenses } from "../controllers/bills.controller";
import { confirmBill, listBills, uploadBill } from "../controllers/receipt.controller";
import { confirmBillSchema, createManualExpenseSchema } from "../validators/bills.validators";

const router = Router();

router.use(authenticate);

router.get("/categories", listCategories);
router.post("/upload", uploadSingleBill, uploadBill);
router.post("/confirm/:receiptId", validateBody(confirmBillSchema), confirmBill);
router.get("/", listBills);
router.post("/manual", validateBody(createManualExpenseSchema), addManualExpense);
router.get("/expenses", listExpenses);

export default router;
