import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readText(filePath) {
  return fs.readFileSync(path.join(root, filePath), "utf8");
}

function exists(filePath) {
  return fs.existsSync(path.join(root, filePath));
}

function assertCheck(condition, message, failures) {
  if (!condition) {
    failures.push(message);
  }
}

function run() {
  const failures = [];

  const requiredFiles = [
    ".env.example",
    "docs/supabase-schema.sql",
    "docs/Deployment-V1.md",
    "docs/Go-Live-Checklist.md",
    ".github/workflows/ci.yml",
    "vercel.json",
    "public/_redirects",
  ];

  for (const file of requiredFiles) {
    assertCheck(exists(file), `Falta archivo requerido: ${file}`, failures);
  }

  if (exists(".env.example")) {
    const envExample = readText(".env.example");
    assertCheck(
      envExample.includes("VITE_SUPABASE_URL="),
      "`.env.example` no incluye `VITE_SUPABASE_URL`",
      failures
    );
    assertCheck(
      envExample.includes("VITE_SUPABASE_ANON_KEY="),
      "`.env.example` no incluye `VITE_SUPABASE_ANON_KEY`",
      failures
    );
  }

  if (exists("package.json")) {
    const pkg = readText("package.json");
    assertCheck(
      /"deploy:check"\s*:\s*"/.test(pkg),
      "`package.json` no define el script `deploy:check`",
      failures
    );
  }

  if (exists("vercel.json")) {
    const vercel = readText("vercel.json");
    assertCheck(
      vercel.includes('"rewrites"') && vercel.includes("index.html"),
      "`vercel.json` debe incluir rewrites SPA hacia index.html",
      failures
    );
  }

  if (exists("public/_redirects")) {
    const redirects = readText("public/_redirects");
    assertCheck(
      redirects.includes("index.html") && redirects.includes("200"),
      "`public/_redirects` debe redirigir rutas SPA a index.html (200)",
      failures
    );
  }

  if (exists(".github/workflows/ci.yml")) {
    const ci = readText(".github/workflows/ci.yml");
    assertCheck(ci.includes("npm run lint"), "CI no ejecuta lint", failures);
    assertCheck(ci.includes("npm run deploy:check"), "CI no ejecuta deploy:check", failures);
    assertCheck(ci.includes("npm run test:coverage"), "CI no ejecuta test:coverage", failures);
    assertCheck(ci.includes("npm run build"), "CI no ejecuta build", failures);
    assertCheck(ci.includes("npm run test:e2e"), "CI no ejecuta test:e2e", failures);
  }

  if (exists("docs/Go-Live-Checklist.md")) {
    const checklist = readText("docs/Go-Live-Checklist.md");
    assertCheck(
      checklist.includes("## Antes del deploy") &&
        checklist.includes("## Durante el deploy") &&
        checklist.includes("## Despues del deploy"),
      "Checklist de go-live incompleto (secciones faltantes)",
      failures
    );
  }

  if (failures.length > 0) {
    console.error("Deploy check falló:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(
    "Deploy check OK: documentos, env, SPA (Vercel/Netlify) y pipeline listos."
  );
}

run();
