import { expect, test } from "@playwright/test";

test("@phase-07 Enter emits a semantic split intent", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("intents")).toContainText('"kind":"split"');
});

test("@phase-07 collapse is renderer-local", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Collapse" }).click();
  await expect(page.getByTestId("collapsed")).toHaveText("B");
  await expect(page.getByTestId("intents")).toHaveText("[]");
});
