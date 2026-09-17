# ACC BAU Tools — Narzędzia, BHP i Pojazdy

Wersja kodu: **0.2.0, 17.09.2026**.

Rozbudowa źródeł z `acc-bau-tools-main.zip`. Zachowano dotychczasowe moduły Narzędzia i BHP/PPE oraz ich logowanie PIN-em. Nowy moduł Pojazdy korzysta z osobnych tabel, prywatnego Storage i kont Supabase Auth.

**To źródła do wdrożenia testowego, nie potwierdzona działająca instalacja produkcyjna.** W środowisku przygotowania wykonano 105 testów czystej logiki i kontrolę składni 21 plików TS/TSX. Nie wykonano pełnego buildu, pełnego sprawdzenia typów ani integracji z prawdziwą bazą. Szczegóły w `docs/WYNIKI-TESTOW.md`.

## Dokumenty

- `START-POJAZDY.md` — uruchomienie, konta, Vercel, Supabase, bezpieczeństwo i odbiór.
- `AUDYT-KODU.md` — co znaleziono, co poprawiono i co nadal wymaga przebudowy.
- `docs/FUNKCJE-POJAZDOW.md` — instrukcja codziennej obsługi.
- `docs/WYNIKI-TESTOW.md` — rzeczywisty zakres testów i ograniczenia.
- `supabase/migrations/202609170001_fleet.sql` — nowe tabele, uprawnienia, Storage, transakcyjny zapis.

## Uruchomienie lokalne

Node.js 22, następnie:

```sh
npm ci
# Utwórz .env.local na podstawie .env.example; wpisz własne dane prywatnie.
npm run dev
```

Przed wdrożeniem:

```sh
npm run check:syntax
npm test
npm run typecheck
npm run build
```

`npm test` obejmuje rzeczywisty silnik operacji, nie React, sieć, Zod ani SQL. Nie zastępuje testów odbiorowych.

## Struktura

```text
app/page.tsx                     Dotychczasowe Narzędzia / BHP + poprawki
app/vehicles/page.tsx            Nowa zakładka /vehicles
app/api/fleet/route.ts           Odczyty i polecenia floty
app/api/fleet/files/route.ts     Prywatne załączniki i podpisane adresy
components/fleet/                Widoki, formularze, elementy interfejsu
lib/fleet/schema.ts             Walidacja żądań i typy
lib/fleet/operations.ts         Reguły biznesowe, uprawnienia, liczniki
lib/fleet/domain.ts             Walidacja → silnik operacji
lib/fleet/logic.ts              Terminy, daty, koszty, CSV, formaty plików
lib/fleet/client.ts             Sesja, HTTP i wysyłanie załączników
lib/fleet/server.ts             Weryfikacja sesji i dostęp serwerowy do bazy
lib/legacy.ts                   Pomocnicza logika bez przepisywania starej aplikacji
supabase/migrations/             Migracja dodająca moduł floty
scripts/                        Testy składni/logiki i ręczne porządkowanie szkiców
```

Nowy moduł jest po polsku. Dotychczasowe przełączanie PL/EN/DE w Narzędziach/BHP pozostawiono. Nie dodano automatycznych wiadomości e-mail/SMS, GPS, OCR faktur ani synchronizacji z księgowością.

Nie publikuj klucza `SUPABASE_SERVICE_ROLE_KEY`. Nigdy nie używaj go w zmiennej `NEXT_PUBLIC_*`, w kodzie przeglądarki ani w repozytorium.
