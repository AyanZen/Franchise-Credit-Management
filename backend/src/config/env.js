import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";

dotenv.config({ path: join(root, envFile) });
