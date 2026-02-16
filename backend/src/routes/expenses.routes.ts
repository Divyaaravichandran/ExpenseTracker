import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { deleteExpense, listExpenses } from "../controllers/bills.controller";

const router = Router();

router.use(authenticate);
router.get("/", listExpenses);
router.delete("/:expenseId", deleteExpense);

export default router;
