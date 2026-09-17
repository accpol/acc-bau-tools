# Sprawdzenia wykonane i odbiór wymagany przed produkcją
**ACC BAU Tools + Pojazdy | 17.09.2026**

## Wynik dostępnych testów

| Sprawdzenie | Wynik | Co obejmuje |
|---|---|---|
| Testy automatyczne Node.js | **102/102 zaliczone**, 0 błędów, 0 pominiętych | Logika floty, scalanie starych danych, wybrane funkcje bezpieczeństwa |
| Parsowanie/transpilacja TypeScript i TSX | **17 plików bez błędów składni** | Źródła aplikacji; nie oznacza pełnego sprawdzenia typów React/Next |
| Ścisłe sprawdzenie typów modułów niezależnych | **5 modułów bez błędów** | `types`, `domain`, `i18n`, `print`, `legacy-safety` |
| Instalacja zależności `npm ci` | **Niewykonana skutecznie** | Dostęp do `registry.npmjs.org` blokował błąd DNS `EAI_AGAIN` |
| Pełny build Next.js | **Niezweryfikowany** | Brak zainstalowanych zależności |
| Interfejs w działającej przeglądarce | **Niezweryfikowany** | Bez uruchomionej aplikacji |
| Migracja i funkcje PostgreSQL | **Nieuruchomione** | Sprawdzono źródło, nie rzeczywiste wykonanie SQL |
| Rzeczywisty Supabase / Storage / Vercel | **Nietestowane** | Nie używano produkcyjnych połączeń, kluczy ani danych |

Próba `npm run build` w tym środowisku zakończyła się komunikatem `next: not found` (kod 127), ponieważ instalacja zależności nie powiodła się. Nie jest to wynik sprawdzenia kompatybilności kodu z Next.js. Surowe wyniki: `WYNIKI_TESTOW.txt`, `SPRAWDZENIE_ZRODEL.txt`, `PROBA_BUILD.txt`.

**102 testy nie są testem kompletnej aplikacji od początku do końca.** W szczególności nie potwierdzają kompilacji całego projektu, poprawności rzeczywistej migracji ani konfiguracji RLS/API w Twoim projekcie.

## Jak uruchomić testy na komputerze lub w środowisku wdrożeniowym

W katalogu projektu, z Node.js 22 i dostępem do npm:

```sh
npm ci
npm test
npm run check:source
npm run build
```

W środowisku przygotowania paczki użyto globalnie dostępnego TypeScript, ponieważ nie można było pobrać zależności projektu:

```sh
NODE_PATH=/opt/nvm/versions/node/v22.16.0/lib/node_modules npm test
NODE_PATH=/opt/nvm/versions/node/v22.16.0/lib/node_modules npm run check:source
```

Druga para poleceń dokumentuje tylko sposób wykonania tutaj; po poprawnym `npm ci` użytkownik nie potrzebuje tej ścieżki. W paczce nie ma `node_modules`, wyników builda ani haseł. Wersji bibliotek i pliku lock nie zmieniano.

## Co sprawdzają testy automatyczne

### `tests/domain.test.cjs`

Walidacja danych pojazdu, dat, przebiegu i pól liczbowych; dozwolone komendy i role; walidacja przebiegów wstecznych; korekty bez usuwania oryginałów; harmonogramy według daty lub kilometrów; przesuwanie tylko wykonanych czynności; ochrona przed cofnięciem nowszego serwisu przez starszy; archiwizacja; edycja planu z zachowaniem poprzedniej wersji; późniejsze załączanie dokumentów; koszty i eksport CSV.

### `tests/legacy.test.cjs`

Scalanie pól i rekordów BHP z zachowaniem nieznanych danych; konflikt zmiany tego samego pola; różne równoczesne wpisy; zachowanie zdjęć i historii; sortowanie dat; brak fizycznych operacji kasowania danych w analizowanych ścieżkach.

Test rzeczywistej funkcji `SettingsModal.save()` wyodrębnionej z AST sprawdza, czy formularz zachowuje `ppeRecords` i dodatkowe pola. Test błędu zapisu sprawdza, że formularz nie zostaje zamknięty. Test cache sprawdza zachowanie starej surowej wartości i odmowę jej nadpisania przy braku miejsca na kopię ratunkową. Badany jest też nowy wydruk pod kątem kodowania HTML.

Kontrola tekstu SQL wykrywa niedozwolone operacje na starych tabelach w dołączonej migracji. **To nie jest parser ani wykonanie PostgreSQL.**

### `tests/server.test.cjs`

Rzeczywista logika kryptograficzna i autoryzacyjna: hashowanie i weryfikacja haseł, losowe sole, podpisy sesji, atrybuty cookie, podmieniona sesja, dezaktywowane konto, zmiana wersji uprawnień, ukrycie hasha, kontrola roli, ukrycie pól finansowych i kontrola pochodzenia żądania zapisu.

Wywołania Next cookies i odpowiedzi Supabase są **zastąpione atrapami**. Testy nie logują użytkowników do rzeczywistej bazy ani nie sprawdzają transmisji przez Vercel.

## Lista odbiorowa — do wykonania na osobnej bazie testowej

### A. Kompilacja i konfiguracja

- [ ] `npm ci`, `npm test`, `npm run check:source` oraz `npm run build` kończą się sukcesem.
- [ ] Oryginalna aplikacja działa bez skonfigurowania floty; brak konfiguracji floty pokazuje czytelny komunikat, nie blokuje Narzędziowni/BHP.
- [ ] Migracja SQL wykonuje się w całości; jej ponowne wykonanie nie kasuje danych i nie tworzy duplikatów.
- [ ] Przed i po migracji zapytanie `verify_legacy_readonly.sql` daje identyczne liczby i skróty starych danych przy wstrzymanych zapisach.
- [ ] Wszystkie nowe tabele mają RLS i właściwe uprawnienia, nowy bucket jest prywatny. Stare magazyny pozostają niezmienione.

### B. Konta i dostęp

- [ ] Pierwszy administrator powstaje po poprawnym logowaniu; złe hasło nie tworzy konta.
- [ ] Po usunięciu dwóch zmiennych bootstrap i ponownym wdrożeniu istniejące konto nadal działa.
- [ ] Nowy pracownik widzi tylko swoje aktualnie przypisane auta, nie widzi faktur ani kosztów.
- [ ] Pracownik nie uzyskuje faktury ani innego pojazdu przez ręczną podmianę ID w żądaniu API.
- [ ] Dezaktywacja konta i zmiana uprawnień blokują jego stare sesje.
- [ ] Nie da się pozbawić dostępu ostatniego administratora.
- [ ] Wielokrotne nieudane logowanie uruchamia limit; po wylogowaniu przeglądarka nie odczytuje danych floty przez API.

### C. Stare Narzędzia i BHP

- [ ] Liczby, nazwy, zdjęcia, załączniki, pracownicy i stare przekazania zgadzają się z kopią wejściową.
- [ ] Zapis jednej zmiany ustawień nie usuwa żadnego wpisu BHP ani dodatkowego pola ustawień.
- [ ] Dodanie lub edycja BHP nie zmienia innych wpisów; dwa równoczesne zapisy nie nadpisują się bez ostrzeżenia.
- [ ] Nowe narzędzie z istniejącym ID jest odrzucone, a stara pozycja pozostaje bez zmian.
- [ ] Odłączenie sieci podczas zapisu daje błąd, nie fałszywe potwierdzenie; formularz pozostaje otwarty.
- [ ] Archiwizacja i przywracanie zachowują dane. Anulowany przegląd nadal ma oryginalny opis i załączniki.
- [ ] Pełna historia ładuje się przy liczbie większej niż 250/500; sprawdzić przejście między stronami API.
- [ ] Stare QR, przekazania, zwroty, filtrowanie i druk nadal działają.

### D. Pojazdy i przebiegi

- [ ] Utworzenie pojazdu, edycja wszystkich zakładek i walidacja ukrytych pól działają na komputerze i telefonie.
- [ ] Aktywny zduplikowany numer rejestracyjny oraz zduplikowany VIN są odrzucane bez utraty danych.
- [ ] Przypisanie i zmiana kierowcy zachowują poprzedniego użytkownika, datę, lokalizację, licznik i zdjęcia.
- [ ] Nowy przebieg, wpis wsteczny i korekta działają; błędny wpis między dwoma odczytami jest odrzucony.
- [ ] Dwie otwarte karty tego samego auta wykrywają konflikt; przegrany zapis nie usuwa zmian drugiego użytkownika.
- [ ] Powtórzenie identycznego żądania po utracie odpowiedzi nie tworzy drugiego wpisu historii.

### E. Serwisy, pliki i archiwum

- [ ] Plan z samą datą, samym licznikiem i oboma progami prawidłowo pokazuje zaległość i ostrzeżenie.
- [ ] Serwis przesuwa tylko wskazane czynności, a nie cały harmonogram. Edycja planu zachowuje poprzedni stan i powód.
- [ ] Faktura PDF oraz zdjęcie dają się wysłać, obejrzeć i pobrać; przetestować plik większy niż 4,5 MB, ale poniżej limitu 20 MiB.
- [ ] Niedozwolony format i plik ponad limit są odrzucone; podpisany URL nie daje trwałego publicznego dostępu.
- [ ] Faktura dołączona później pojawia się pod właściwą naprawą, oryginalny wpis nie zostaje zastąpiony.
- [ ] Anulowanie formularza po wysłaniu dokumentu pozostawia go do późniejszego podpięcia, nie kasuje pliku.
- [ ] Krytyczna usterka wyłącza pojazd z użycia; zamknięcie zgłoszenia nie przywraca automatycznie gotowości.
- [ ] Suma kosztów rozdziela waluty oraz netto/brutto. CSV, wydruk i eksport JSON zachowują polskie znaki.
- [ ] Archiwizacja i przywracanie pojazdu zachowują całą historię, plany i dokumenty.
- [ ] Interfejs PL, EN i DE mieści długie opisy; modal ma przewijanie, focus i czytelne błędy także na telefonie.

## Wdrożenie produkcyjne dopiero po odbiorze

Przed produkcją ponowić kopię bazy i plików oraz zachować poprzedni działający kod. Preview z produkcyjnymi kluczami zapisuje do produkcyjnej bazy — nie używać go do powyższych testów tworzenia i edycji danych. Po wdrożeniu kontrolować stare dane i błędy logów. Nie usuwać rekordów testowych z produkcji; dlatego testy zapisów mają odbywać się w środowisku odizolowanym.
