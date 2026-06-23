#!/usr/bin/env sh
# Cloud Run migrate job: Prisma CLI expects ?socket= for Unix sockets (Cloud SQL).
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

exec npx prisma migrate deploy