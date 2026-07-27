import { config } from "dotenv";
config({ path: ".env.test" });

if (!process.env.DATABASE_URL?.includes("vtu_app_test")) {
  throw new Error(
    "Refusing to run tests: DATABASE_URL doesn't point at the test database. " +
      "Check web/.env.test (copy from .env.test.example).",
  );
}
