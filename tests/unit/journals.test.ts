import { expect, it } from "vitest";
import { createJournalService } from "../../packages/journals/src/index.js";
it("uses canonical ISO dates for idempotent journal identity", () => { let id = 0; const journals = createJournalService({ next: () => `journal-${++id}` }); expect(journals.get("2026-09-14", "14 Sep")).toEqual(journals.get("2026-09-14", "2026/09/14")); });
