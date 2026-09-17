# Porównanie plików z oryginalnym ZIP-em

Weryfikacja dotyczy plików źródłowych, nie danych zapisanych w Supabase.

- Pliki oryginalne: **24**.
- Oryginalne ścieżki zachowane: **24 / 24**.
- Usunięte pliki oryginalne: **0**.
- Pliki zmodyfikowane: **5**.
- Pliki identyczne bajt po bajcie: **19**.
- `package-lock.json`: identyczny z wejściowym; wersje zależności nie zostały zmienione.
- ZIP nie zawiera `node_modules`, `.next`, haseł ani kopii bazy.

SHA-256 wejściowego ZIP-a: `6f19aa7de01129de1543a2e1b4006e37d5b29a3948f39f472d26670aca3a1024`.

## Zmienione istniejące pliki

| Ścieżka | SHA-256 oryginału | SHA-256 wersji w paczce |
|---|---|---|
| `.gitignore` | `207e265ff4901f9ad9f96d8ce08530e04f9fc600815472a66d0a446096d654cd` | `f127dfd72cdea54c14de83e722768bf06d6a7b848fd7d8672fceddc453f1d2f0` |
| `README.md` | `60b55ff7df79af72590f9524208e46642bc32bdc175cdad41349681c0e2f958f` | `4b4be90d9d0f2375b191f3bf1959507f4fab615f838c7d7ba4ec41df51109c76` |
| `app/layout.tsx` | `b98a24027c5c78385b127baf3c2f4f29b18c2c8c19c0beed8c74bb57bd98e4ef` | `baaa6ceba95b8fda236300ed2a0539cc802f21a45a8e0050e00248e07d1a7866` |
| `app/page.tsx` | `92c257f0134e53b70df217664ef2f4558001100bf73d46f6ca13e1ed4df52ea5` | `0e9076ba89bf494fa0828f9f202bb2f35ab0c95d113b6e1279448af4aa931e84` |
| `package.json` | `92ac2ff69666da36d764fbe0619cc7efbdc0c68ddb42004922790963686df713` | `a69e5f7237e91a55d55ec6407f34b46fc8ab82d1993043bab4aea57d4160611e` |

## Dodane pliki

- `.env.example`
- `START_TUTAJ_PL.md`
- `app/api/fleet/[...path]/route.ts`
- `components/fleet/FleetPage.tsx`
- `components/fleet/common.tsx`
- `components/fleet/forms.tsx`
- `docs/OBSLUGA_POJAZDOW_PL.md`
- `docs/PROBA_BUILD.txt`
- `docs/RAPORT_ANALIZY_PL.md`
- `docs/SPRAWDZENIE_ZRODEL.txt`
- `docs/TESTY_PL.md`
- `docs/WDROZENIE_POJAZDY_PL.md`
- `docs/WYNIKI_TESTOW.txt`
- `lib/fleet/client.ts`
- `lib/fleet/domain.ts`
- `lib/fleet/i18n.ts`
- `lib/fleet/print.ts`
- `lib/fleet/server.ts`
- `lib/fleet/types.ts`
- `lib/legacy-safety.ts`
- `scripts/check-syntax.cjs`
- `scripts/test-register.cjs`
- `supabase/migrations/202609170001_acc_fleet_additive.sql`
- `supabase/verify_legacy_readonly.sql`
- `tests/domain.test.cjs`
- `tests/legacy.test.cjs`
- `tests/server.test.cjs`
- `docs/ZMIANY_PLIKOW.md` (niniejszy raport).

## Zachowane bez zmian

- `.gitattributes`
- `AGENTS.md`
- `CLAUDE.md`
- `app/favicon.ico`
- `app/globals.css`
- `components.json`
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `eslint.config.mjs`
- `lib/utils.ts`
- `next.config.ts`
- `package-lock.json`
- `postcss.config.mjs`
- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`
- `tsconfig.json`
