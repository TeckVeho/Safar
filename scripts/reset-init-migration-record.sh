#!/usr/bin/env sh
# One-off: clear a falsely "applied" init migration so migrate deploy can re-run.
set -eu

if [ -n "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="$(
    node -e "
      const raw = process.env.DATABASE_URL;
      try {
        const u = new URL(raw);
        const socketPath = u.searchParams.get('socketPath');
        if (socketPath && !u.searchParams.has('socket')) {
          u.searchParams.set('socket', socketPath);
          u.searchParams.delete('socketPath');
        }
        process.stdout.write(u.toString());
      } catch {
        process.stdout.write(raw);
      }
    "
  )"
fi

printf '%s\n' "DELETE FROM _prisma_migrations WHERE migration_name = '20250622000000_init';" \
  | npx prisma db execute --stdin --schema prisma/schema.prisma
