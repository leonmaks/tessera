import { expect, it } from "vitest";
import { createTaskService } from "../../packages/tasks/src/index.js";
it("cycles and completes daily repeating tasks atomically", () => { const tasks = createTaskService(["Todo", "Doing", "Done"]); tasks.create({ uuid: "task", status: "Todo", scheduled: "2026-09-14", repeat: "daily" }); expect(tasks.cycle("task").status).toBe("Doing"); expect(tasks.complete("task")).toMatchObject({ status: "Todo", scheduled: "2026-09-15" }); });
