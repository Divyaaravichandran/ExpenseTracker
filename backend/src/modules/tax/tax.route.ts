import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import {
  createTaxRuleController,
  deleteTaxRuleController,
  getTaxSectionExpensesController,
  getTaxSummaryController,
  getTaxUtilizationTimelineController,
  listTaxRulesController,
  overrideExpenseTaxController,
  updateTaxRuleController
} from "./tax.controller";

const reportsRouter = Router();
const taxRulesRouter = Router();

reportsRouter.use(authenticate);
reportsRouter.get("/tax-summary", getTaxSummaryController);
reportsRouter.get("/tax-summary/section-expenses", getTaxSectionExpensesController);
reportsRouter.get("/tax-summary/timeline", getTaxUtilizationTimelineController);

taxRulesRouter.use(authenticate);
taxRulesRouter.post("/", createTaxRuleController);
taxRulesRouter.get("/", listTaxRulesController);
taxRulesRouter.patch("/:id", updateTaxRuleController);
taxRulesRouter.delete("/:id", deleteTaxRuleController);
taxRulesRouter.patch("/expenses/:expenseId/override", overrideExpenseTaxController);

export { reportsRouter, taxRulesRouter };
