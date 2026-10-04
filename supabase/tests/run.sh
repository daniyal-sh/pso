#!/usr/bin/env bash
# Applies every migration twice (they must be re-runnable) and runs the behaviour checks
# against a throwaway Postgres database. Usage: PGHOST=... PGUSER=... supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

db="${PSO_TEST_DB:-pso_migration_test}"
# Re-running migrations emits expected "already exists, skipping" notices; hide them.
quiet="-c client_min_messages=warning"
PGOPTIONS="$quiet" psql -q -v ON_ERROR_STOP=1 -d postgres -c "drop database if exists ${db}" -c "create database ${db}"
PGOPTIONS="$quiet" psql -q -v ON_ERROR_STOP=1 -d "$db" -f supabase/tests/supabase_stubs.sql

for pass in 1 2; do
  for migration in supabase/migrations/*.sql; do
    PGOPTIONS="$quiet" psql -q -v ON_ERROR_STOP=1 -d "$db" -f "$migration" > /dev/null
  done
  echo "Migrations applied (pass ${pass})"
done

psql -q -v ON_ERROR_STOP=1 -d "$db" -f supabase/tests/admin_functions.sql 2>&1 | grep -E "PASS|FAILED|ERROR" | sed 's/^.*NOTICE: *//'
echo "All database checks passed"
