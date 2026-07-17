function isPrismaError(err) {
  const name = err?.name || "";
  const code = err?.code || "";
  return (
    name.startsWith("PrismaClient") ||
    code.startsWith("P") ||
    /Invalid `prisma\./i.test(err?.message || "")
  );
}

export function safeErrorMessage(err, fallback = "Internal server error") {
  if (isPrismaError(err)) {
    if (err?.code === "P2002") return "That record already exists.";
    if (/Unknown argument/i.test(err?.message || "")) {
      return "Server is out of date with the database schema. Restart the API after running migrations.";
    }
    return fallback;
  }

  if (process.env.NODE_ENV !== "production" && err?.message) {
    return err.message;
  }
  return fallback;
}
