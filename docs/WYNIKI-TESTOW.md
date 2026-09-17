# Wyniki weryfikacji — ACC BAU Tools 0.2.0

Data: 17.09.2026. Przedmiot: zmodyfikowane źródła programu z zakładką Pojazdy i ograniczonymi poprawkami Narzędzi/BHP.

## Wynik wykonanych kontroli

| Kontrola | Rzeczywisty wynik | Czego ten wynik nie potwierdza |
|---|---|---|
| Testy jednostkowe rzeczywistej logiki aplikacji | **105 wykonanych, 105 zaliczonych, 0 błędów, 0 pominiętych** | Uruchomienia interfejsu, walidacji Zod, sieci i bazy |
| Parsowanie TypeScript/TSX | **21 plików, 0 błędów składni** | Zgodności typów, zgodności API zależności i pełnej kompilacji |
| `node --check` | Poprawna składnia 3 skryptów w katalogu `scripts` | Działania skryptu porządkowania na rzeczywistym Storage |
| Statyczna kontrola lokalnych importów | 43 odwołania, brak brakujących plików | Rozwiązania importów pakietów npm i działania bundlera Next.js |
| `package.json` względem `package-lock.json` | Deklaracje bezpośrednich zależności zgodne z sekcją główną lockfile; wpisy tych pakietów obecne | Pomyślnej instalacji pakietów ani braku podatności w zależnościach |

Surowy wynik ostatniego przebiegu jest w `docs/test-log.txt`; kontrola składni w `docs/syntax-log.txt`.

## Co obejmują testy jednostkowe

Testy uruchamiają kod z `lib/fleet/logic.ts`, `lib/fleet/operations.ts`, `lib/fleet/defaults.ts` i `lib/legacy.ts`, po technicznej transpileacji TypeScript. Nie podmieniono silnika reguł na atrapę. W kodzie jednostkowym jawnie przekazywane są dane, użytkownicy i daty testowe.

Sprawdzane są między innymi:

- daty kalendarzowe, lata przestępne, zmiana czasu, koniec miesiąca oraz rozdzielenie braku licznika od zera;
- kolejność terminów według daty, kilometrów i motogodzin, brak skonfigurowanego harmonogramu oraz nieaktualne odczyty;
- tworzenie pojazdu, role i uprawnienia, wymagana wersja karty, konflikt zapisu, przypisanie kierowcy i ograniczenia pracownika;
- chronologia przebiegu, odczyty historyczne, korekty administratora i brak przypadkowego zmniejszania aktualnego licznika;
- niezależne harmonogramy, zakończenie wybranych czynności, powtarzanie od rzeczywistego wykonania i jawne nadpisanie kolejnego terminu;
- wymagany wynik badania, wynik negatywny, zgłoszenie krytyczne, blokada wydania pojazdu oraz osobne zamknięcie usterki;
- protokół przekazania i zwrotu, wymagany odczyt, użytkownik zewnętrzny i archiwizacja;
- oddzielne waluty, sumowanie kwot brutto w najmniejszych jednostkach, unieważnienie kosztu bez kasowania historii i ukrywanie danych finansowych przed pracownikiem;
- podpis żądania do identyfikowania ponowień operacji, ochrona oryginalnych danych wejściowych przed modyfikacją, eksport CSV i rozpoznawanie nagłówków plików;
- scalanie zmian starych ustawień bez usunięcia PPE, odrzucanie konfliktów pól, wybór najnowszej kontroli danego typu, wyniki negatywne i umieszczenie polityki CSP w wydruku.

To testy logiczne na danych lokalnych. Przykładowo test wersji karty sprawdza reakcję silnika reguł, ale nie zastępuje równoczesnego zapisu dwóch prawdziwych sesji do PostgreSQL. Test uprawnień sprawdza reguły kodu, ale nie jest testem wdrożonych polityk RLS. Kontrola nagłówka pliku nie jest skanowaniem antywirusowym.

## Czego nie udało się sprawdzić

Instalacja `npm ci` została podjęta, lecz zakończyła się problemem DNS/dostępu do `registry.npmjs.org` (`EAI_AGAIN`). Pełne zależności projektu nie były dostępne w środowisku przygotowania.

Z tego powodu **nie potwierdzono**:

1. pełnego `npm run typecheck`, `npm run build` ani przebiegu CI GitHub Actions;
2. walidacji wejścia przez rzeczywiście uruchomiony pakiet Zod;
3. działania aplikacji React w przeglądarce, wyglądu na telefonie, aparatu, podglądów dokumentów i wydruków;
4. logowania i resetowania haseł w rzeczywistym projekcie Supabase Auth;
5. wykonania migracji SQL, działania transakcji PostgreSQL, RLS ani polityk Storage;
6. rzeczywistego przesyłania, podpisanych adresów, kontroli uprawnień załączników i sprzątania plików;
7. komunikacji z wdrożeniem Vercel i zachowania dotychczasowych danych użytkownika po wdrożeniu.

Nie wykonywano pełnego audytu bezpieczeństwa ani audytu podatności zależności. Nie uruchamiano żadnej migracji lub operacji na produkcyjnej bazie użytkownika. Nie prezentowano zrzutów rzekomo działającej aplikacji.

## Jak powtórzyć weryfikację

W środowisku z dostępem do npm, przy Node.js 22:

```sh
npm ci
npm run check:syntax
npm test
npm run typecheck
npm run build
```

Do przebiegu lokalnego w środowisku przygotowania wykorzystano dostępny globalnie kompilator TypeScript:

```sh
NODE_PATH=$(npm root -g) npm test
NODE_PATH=$(npm root -g) node scripts/check-syntax.cjs
node --check scripts/cleanup-fleet-uploads.mjs
node --check scripts/check-syntax.cjs
node --check scripts/run-tests.cjs
```

Ustawienie `NODE_PATH` było obejściem braku lokalnego pakietu TypeScript wyłącznie dla testów logiki i parsowania. **Nie zastępuje `npm ci` ani pełnego buildu.**

## Warunek dopuszczenia do produkcji

Najpierw kopia danych i oddzielna wersja próbna z oddzielną bazą. Wykonać wszystkie polecenia powyżej oraz testy odbiorowe opisane w `START-POJAZDY.md`, szczególnie administrator/pracownik, odmowa publicznego dostępu do faktury, dwa równoczesne zapisy, negatywne badanie, przekazanie pojazdu i zachowanie danych PPE po zmianie ustawień.

**Ocena stanu:** implementacja źródłowa przygotowana do dalszej weryfikacji na wersji próbnej; działanie całego systemu i gotowość produkcyjna nie są jeszcze potwierdzone.
