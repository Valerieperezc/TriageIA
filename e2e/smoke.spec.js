import { test, expect } from "@playwright/test";

async function loginLocalAdmin(page) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill("admin@triage.com");
  await page.getByTestId("login-password").fill("123456");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("dashboard-title")).toBeVisible({
    timeout: 20_000,
  });
}

async function loginLocalMedico(page) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill("medico@triage.com");
  await page.getByTestId("login-password").fill("123456");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("dashboard-title")).toBeVisible({
    timeout: 20_000,
  });
}

test.describe("smoke local", () => {
  test("login modo local y ver dashboard", async ({ page }) => {
    await loginLocalAdmin(page);
  });

  test("navega a pacientes tras login", async ({ page }) => {
    await loginLocalAdmin(page);
    await page.goto("/patients");
    await expect(page.getByPlaceholder("Nombre o síntoma")).toBeVisible();
  });

  test("rol medico no accede a auditoria: redirige al dashboard", async ({ page }) => {
    await loginLocalMedico(page);
    await page.goto("/audit");
    await expect(page.getByTestId("dashboard-title")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Historial" })).toHaveCount(0);
  });

  test("ingreso minimo: solo vitales y nombre generico", async ({ page }) => {
    await loginLocalAdmin(page);
    await page.goto("/triage");
    await page.getByTestId("triage-fast-track").check();
    await page.getByTestId("triage-temp").fill("39.5");
    await page.getByTestId("triage-fc").fill("110");
    await page.getByTestId("triage-submit").click();
    await page.goto("/patients");
    await expect(
      page.getByText("Paciente sin identificar", { exact: false }).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("flujo esencial: registrar, cambiar estado y ver auditoria", async ({ page }) => {
    await loginLocalAdmin(page);

    const uniqueName = `Paciente E2E ${Date.now()}`;

    await page.goto("/triage");
    await page.getByTestId("triage-name").fill(uniqueName);
    await page.getByTestId("triage-age").fill("34");
    await page.getByTestId("triage-symptom").fill("Dolor abdominal");
    await page.getByTestId("triage-temp").fill("41");
    await page.getByTestId("triage-fc").fill("95");
    await expect(page.getByTestId("triage-preview")).toContainText("Nivel I");
    await page.getByTestId("triage-submit").click();

    await page.goto("/patients");
    await page.getByText(uniqueName, { exact: false }).first().click();

    await expect(page.getByTestId("patient-detail-status")).toContainText("En espera");
    await page.getByTestId("patient-status-attend").click();
    await expect(page.getByTestId("patient-detail-status")).toContainText("En atención");
    await page.getByTestId("patient-status-finalize").click();
    await expect(page.getByTestId("patient-detail-status")).toContainText("Finalizado");

    await page.goto("/audit");
    await expect(page.getByText(uniqueName, { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Actor: admin@triage.com", { exact: false }).first()).toBeVisible();
  });

  test("auditoria: telemetria post-login en historial y limpiar", async ({ page }) => {
    await loginLocalAdmin(page);
    await page.goto("/audit");

    await expect(page.getByTestId("audit-post-login-summary")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("audit-post-login-summary")).toContainText("Última:");

    await page.getByTestId("audit-post-login-reset").click();
    await expect(page.getByTestId("audit-post-login-empty")).toBeVisible();
  });

  test("telemetria de reintentos persistida se puede limpiar", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "triageia:retry-stats",
        JSON.stringify({
          totalRetries: 3,
          recoveredLoads: 1,
          recoveredActions: 1,
          failedLoads: 0,
          failedActions: 1,
          lastRetryAt: Date.now(),
        })
      );
    });

    await loginLocalAdmin(page);
    await expect(page.getByTestId("retry-indicator")).toContainText("Reintentos: 3");
    await expect(page.getByTestId("retry-indicator")).toContainText("Alerta");
    await page.getByTestId("retry-reset").click();
    await expect(page.getByTestId("retry-indicator")).toHaveCount(0);
  });
});
