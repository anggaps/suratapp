import { PrismaClient } from "@prisma/client";

/**
 * Build a serverless-friendly datasource URL for Neon's pooled endpoint.
 *
 * Neon's `-pooler` host runs PgBouncer in transaction mode, which does not
 * keep prepared statements across transactions. Prisma uses prepared
 * statements by default, so without `pgbouncer=true` it intermittently
 * throws ("prepared statement ... does not exist") or exhausts connections
 * on Vercel serverless — surfacing as generic "server error" / crashed
 * requests. We append the PgBouncer flags at runtime so no manual env var
 * change is required, and drop `channel_binding` (unsupported through the
 * pooler) while keeping `sslmode`.
 *
 * NB: the Prisma CLI (migrate/generate) reads `env("DATABASE_URL")` from
 * schema.prisma directly, so this runtime override does not affect
 * migrations — they still use the raw connection string.
 */
function buildDatasourceUrl(): string | undefined {
  const base = process.env.DATABASE_URL;
  if (!base) return undefined;
  if (base.includes("pgbouncer=")) return base;

  const [dsn, query = ""] = base.split("?");
  const params = new URLSearchParams(query);
  params.delete("channel_binding");
  params.set("pgbouncer", "true");
  params.set("connection_limit", "1");
  params.set("connect_timeout", "15");
  return `${dsn}?${params.toString()}`;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ datasourceUrl: buildDatasourceUrl() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;