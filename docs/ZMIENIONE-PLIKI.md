# Zmienione pliki — wersja 0.2.0

Porównanie z dostarczonym `acc-bau-tools-main.zip`. Dokumentacja i logi testowe należą do paczki; katalogi zależności oraz prywatne pliki środowiska nie należą.

## Zmodyfikowane istniejące pliki

- `.gitignore`
- `README.md`
- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `package-lock.json`
- `package.json`

## Dodane pliki

- `.env.example`
- `.github/workflows/check.yml`
- `AUDYT-KODU.md`
- `START-POJAZDY.md`
- `app/api/fleet/files/route.ts`
- `app/api/fleet/route.ts`
- `app/vehicles/page.tsx`
- `components/fleet/FleetApp.tsx`
- `components/fleet/forms.tsx`
- `components/fleet/ui.tsx`
- `docs/FUNKCJE-POJAZDOW.md`
- `docs/README-oryginalny.md`
- `docs/WYNIKI-TESTOW.md`
- `docs/ZMIENIONE-PLIKI.md`
- `docs/syntax-log.txt`
- `docs/test-log.txt`
- `lib/fleet/client.ts`
- `lib/fleet/defaults.ts`
- `lib/fleet/domain.ts`
- `lib/fleet/logic.ts`
- `lib/fleet/operations.ts`
- `lib/fleet/print.ts`
- `lib/fleet/schema.ts`
- `lib/fleet/server.ts`
- `lib/legacy.ts`
- `scripts/check-syntax.cjs`
- `scripts/cleanup-fleet-uploads.mjs`
- `scripts/run-tests.cjs`
- `supabase/migrations/202609170001_fleet.sql`
- `tests/fleet.test.cjs`

Pełna przebudowa starego modułu Narzędzi/BHP nie została wykonana. Nowa flota znajduje się w wydzielonych plikach, a migracja SQL dodaje osobne tabele.
