# Bezpieczne wdrożenie zakładki Pojazdy

Stan paczki: 17.09.2026. Nie jest to informacja o wykonanym wdrożeniu. Działająca baza i ustawienia Vercel nie były dostępne w trakcie przygotowania zmian.

## 1. Ustal właściwy projekt i wykonaj kopię

W Vercel otwórz istniejący projekt ACC BAU Tools. Sprawdź repozytorium w Settings → Git oraz istniejące `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Docelowo obie te zmienne mają pozostać przy obecnym projekcie Tools — nie przy Alex Brain, nie przy przypadkowym nowym projekcie.

Zabezpiecz bazę razem ze schematem i politykami dostępu, a osobno obiekty Storage. Supabase wyraźnie odróżnia backup bazy od plików: backup bazy obejmuje metadane Storage, ale nie zawartość plików [1]. Sprawdź, czy kopię można odczytać/odtworzyć w odizolowanym środowisku. Zapisz liczbę narzędzi, historii, pracowników i PPE. Nie używaj przycisków Reset/Delete/Restore w produkcji do przeprowadzenia tej aktualizacji.

Do porównania stanu przed i po samej migracji dołączono `supabase/verify_legacy_readonly.sql`. Skrypt wyłącznie odczytuje liczniki i sumy kontrolne `tools`, `history`, `settings` oraz PPE. Uruchom go przy wstrzymanych zapisach użytkowników, bo zwykłe używanie programu także zmienia sumy kontrolne. Ten odczyt nie zastępuje backupu.

## 2. Najpierw testy kodu i baza testowa

Utwórz gałąź testową istniejącego repozytorium i wgraj pliki projektu, zachowując strukturę `app/`, `components/`, `lib/`, `package.json` itd. Nie przesyłaj `node_modules`, `.next`, `.env.local` ani samych ZIP-ów zamiast rozpakowanych plików.

W środowisku mającym dostęp do npm:

```bash
npm ci
npm test
npm run check:source
npm run build
```

Wersje zależności nie zostały podniesione. `server-only` jest znacznikiem obsługiwanym przez Next.js; zgodnie z dokumentacją jego osobna instalacja nie jest konieczna [4].

Preview konfiguruj do osobnej bazy testowej, jeżeli będą wykonywane zapisy. Tylko oddzielny backend izoluje testy od produkcji. Same tabele nowych pojazdów można przetestować na pustych danych, ale regresję Narzędziowni/BHP trzeba sprawdzić na odpowiednio zabezpieczonej kopii schematu i danych. Nie przesyłaj pracowniczych danych do publicznego repozytorium.

Bez konfiguracji serwerowej moduł Pojazdy wyświetla informację o wymaganym uruchomieniu. Nie powinien wymuszać migracji starej Narzędziowni/BHP.

## 3. SQL — wyłącznie nowe obiekty

Plik do uruchomienia w SQL Editorze właściwego Supabase:

`supabase/migrations/202609170001_acc_fleet_additive.sql`

Najpierw wykonaj go w bazie testowej, sprawdź wyniki oraz scenariusze z `TESTY_PL.md`. Dopiero potem, w oknie wdrożenia po backupie, w istniejącym projekcie produkcyjnym Tools.

Skrypt działa w transakcji i dodaje:

- tabele `acc_fleet_*` dla pojazdów, kont, historii, plików, audytu i limitowania prób logowania;
- funkcje zapisu pojedynczego pojazdu i dopisania historii w jednej transakcji;
- kontrolę wersji rekordów i unikalności aktywnej rejestracji/VIN;
- blokady kasowania rekordów nowego modułu i zmieniania jego historii;
- prywatny bucket `acc-fleet-private-v1` i politykę ograniczoną do tego bucketu.

Nie wykonuje INSERT/UPDATE/DELETE/ALTER/TRUNCATE na `tools`, `history`, `settings`. Nie przenosi PPE i nie zmienia starych Storage bucketów na publiczne. Polityka na `storage.objects` odcina publiczny dostęp wyłącznie do nowego bucketu; jej warunek przepuszcza inne buckety, które nadal podlegają swoim dotychczasowym zasadom.

Skrypt jest napisany tak, aby ponowne uruchomienie tej samej wersji nie tworzyło duplikatów i nie zerowało tabel. Nie zastępuje to testu na rzeczywistym schemacie. Nietypowe istniejące obiekty o identycznych nazwach, ograniczenia uprawnień lub konfiguracja Storage wymagają sprawdzenia przez administratora.

Po samej migracji porównaj wyniki `verify_legacy_readonly.sql`. Przy wstrzymanych zapisach powinny być identyczne. Nie kontynuuj przy nieoczekiwanej różnicy.

## 4. Zmienne w Vercel

W istniejącym projekcie Vercel, Settings → Environment Variables, dodaj nowe wartości. Uważaj na zakres Development / Preview / Production. Zmiana wartości nie przebudowuje automatycznie wszystkich istniejących deploymentów — uruchom nowy deployment/redeploy po konfiguracji [3].

| Zmienna | Wymagania |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Istniejący adres właściwego projektu; zachowaj dotychczasową wartość Production. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Istniejący publiczny klucz; zachowaj wartość Production. |
| `SUPABASE_SERVICE_ROLE_KEY` | Klucz serwerowy `service_role` tego samego projektu, dostępny w ustawieniach kluczy API Supabase. Nie używaj klucza anon. |
| `FLEET_SESSION_SECRET` | Losowy sekret, minimum 32 znaki. Zalecany wynik polecenia poniżej. |
| `FLEET_BOOTSTRAP_USER` | Dokładna nazwa pierwszego administratora, np. imię i nazwisko z Tools. |
| `FLEET_BOOTSTRAP_PIN` | Początkowe mocne hasło; minimum 8 znaków, zalecane 16+. |

Serwerowy klucz omija RLS i musi pozostać poufny [2]. Nie umieszczaj go w kodzie ani w zmiennej `NEXT_PUBLIC_*`. Nie przesyłaj wartości kluczy do rozmowy. W repozytorium znajduje się wyłącznie pusty `.env.example`.

Wygenerowanie sekretu sesji na swoim komputerze:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Do lokalnych testów użyj `.env.local`, którego nie wolno commitować. W testowym środowisku nie używaj produkcyjnego klucza serwerowego.

## 5. Konta i pierwsze uruchomienie

Po poprawnym buildzie, migracji i konfiguracji wybierz w aplikacji Pojazdy. Zaloguj się wartościami bootstrap. Pierwszy użytkownik zostanie utworzony tylko wtedy, gdy w nowej tabeli nie ma jeszcze żadnego konta.

Stare PIN-y Tools/BHP nie są kopiowane do floty. To celowe: w istniejącej aplikacji sprawdzanie PIN-u odbywało się w przeglądarce, a nowy moduł ma chronić faktury i koszty na serwerze. Konta floty mają osobne, hashowane hasła. Sesja trwa maksymalnie 8 godzin.

W panelu Dostępy dodaj pracowników. Nazwa konta powinna dokładnie odpowiadać nazwie kierowcy wpisanej przy pojeździe. Pracownik zobaczy tylko aktualnie przypisane mu pojazdy. Może dopisać licznik, zdjęcia i usterkę; nie otrzymuje faktur ani pól kosztowych. Administrator ma całą flotę. Zmiana konta unieważnia jego stare sesje. Nazw istniejących kont nie zmieniamy, aby nie zerwać przypisań kierowców; konto można wyłączyć, ale nie skasować.

Po pierwszym zalogowaniu usuń obie zmienne `FLEET_BOOTSTRAP_*` i wykonaj redeploy. Hasło zapisane jako hash w bazie nadal działa. Sekret `FLEET_SESSION_SECRET` pozostaje. Jego zmiana wyloguje wszystkie konta floty.

## 6. Odbiór przed produkcją

Wykonaj wszystkie scenariusze z `TESTY_PL.md`, w szczególności: zapis Ustawień bez utraty PPE; edycja równocześnie na dwóch urządzeniach; serwis aktualizujący tylko wybrane terminy; prywatność faktury; dołączenie faktury po zapisaniu naprawy; archiwizacja/przywrócenie; brak duplikatu po ponowieniu zapisu.

Nie traktuj 102 automatycznych testów logiki jako dowodu działania całej integracji. Potrzebny jest poprawny `npm run build`, test w przeglądarce i test z rzeczywistym Supabase. Bez tego nie promuj wersji do Production.

## 7. Cofnięcie kodu bez kasowania danych

W razie problemu można cofnąć deployment kodu. **Nie usuwaj nowych tabel, bucketu, historii ani plików. Nie uruchamiaj skryptu resetującego bazę.** Nowe dane floty mogą pozostać w osobnych tabelach i zostać ponownie obsłużone przez poprawiony kod.

Uwaga: powrót do starego kodu przywraca również jego dotychczasowe problemy, w tym ryzyko zgubienia PPE przy zapisie ustawień. Do czasu poprawki nie zapisuj ustawień w starej wersji. Stary interfejs nie rozumie też znaczników archiwizacji i może znów pokazywać takie rekordy na głównej liście.

## 8. Kopie po wdrożeniu

Utrzymuj regularny backup bazy i oddzielny backup plików. Eksport JSON z karty pojazdu zawiera metadane oraz historię, lecz nie binarną zawartość faktur/zdjęć. Eksport CSV zawiera tylko aktualnie przefiltrowaną listę floty.

Lokalna kopia ratunkowa w Ustawieniach obejmuje tylko to, co było zapisane w danej przeglądarce. Może zawierać stare PIN-y i dane pracowników. Przechowuj ją poufnie. Nie ma automatycznego importu/odtwarzania, które mogłoby nadpisać aktualne dane.

## Źródła techniczne

[1] Supabase — Database Backups: https://supabase.com/docs/guides/platform/backups

[2] Supabase — API keys: https://supabase.com/docs/guides/getting-started/api-keys

[3] Vercel — Environment variables: https://vercel.com/docs/environment-variables

[4] Next.js — Server and Client Components, server-only: https://nextjs.org/docs/app/getting-started/server-and-client-components

[5] Supabase — Private/public Storage buckets: https://supabase.com/docs/guides/storage/buckets/fundamentals
