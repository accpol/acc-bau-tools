# START — uruchomienie modułu Pojazdy

**ACC BAU Tools 0.2.0 • 17.09.2026**

## Najważniejsze przed rozpoczęciem

To jest cały zmodyfikowany kod programu, ale nie kopia bazy ani zapisanych zdjęć. Nowa zakładka wymaga jednorazowej konfiguracji Supabase. Samo wgranie ZIP-a do GitHub nie utworzy tabel i kont.

Nie wdrożono zmian na Twoich kontach i nie przeniesiono żadnych danych. Nie potwierdzono pełnego uruchomienia aplikacji: instalację zależności w środowisku przygotowania zablokował błąd DNS do npm. Przed podmianą używanej wersji wykonaj build oraz testy odbiorowe opisane poniżej.

**Logowanie do Pojazdów to e-mail i hasło, a nie PIN z Narzędzi/BHP.** To zamierzona zmiana dla nowego modułu, ponieważ są w nim faktury. Dotychczasowe dwa moduły zachowują stare logowanie. Konta floty nie powstają automatycznie z listy pracowników w ustawieniach.

## 1. Zrób kopię i przygotuj środowisko próbne

Zachowaj oryginalny ZIP i bieżący commit repozytorium. Zrób kopię bazy Supabase i osobno zapisanych plików Storage. Kopia samego kodu nie jest kopią danych.

Najpierw użyj osobnej gałęzi GitHub i podglądu Vercel oraz testowego projektu Supabase. Podgląd Vercel podłączony do produkcyjnej bazy nadal zmienia produkcyjne dane — nie jest izolowaną piaskownicą. Dla testów można utworzyć zanonimizowaną kopię obecnej bazy; bez starych tabel `tools`, `settings`, `history` nowa flota może działać, ale nie przetestujesz starej narzędziowni.

Nie importuj danych demonstracyjnych do działającej floty. Używaj testowych rejestracji i dokumentów bez danych osobowych.

## 2. Wgraj źródła do repozytorium

Rozpakuj ZIP. W repozytorium podmień pliki ich odpowiednikami i dodaj nowe foldery. `package.json`, `app`, `components`, `lib` i `supabase` mają znajdować się w katalogu głównym projektu, a nie wewnątrz dodatkowego katalogu z nazwą ZIP-a.

Ważne nowe miejsca to `app/vehicles`, `app/api/fleet`, `components/fleet`, `lib/fleet` i migracja SQL. Samo skopiowanie `app/page.tsx` nie wystarczy.

Nie wgrywaj `.env.local`, `node_modules` ani `.next`. Plik `.env.example` zawiera jedynie wzór.

## 3. Utwórz tabele i magazyn plików w Supabase

W projekcie testowym otwórz **SQL Editor**, utwórz nowe zapytanie i uruchom całą zawartość:

```text
supabase/migrations/202609170001_fleet.sql
```

Skrypt tworzy:

| Element | Przeznaczenie |
|---|---|
| `acc_fleet_members` | Konta floty i role |
| `acc_fleet_vehicles` | Karty pojazdów, liczniki, terminy, otwarte usterki |
| `acc_fleet_events` | Historia zdarzeń i kosztów |
| `acc_fleet_files` | Metadane załączników |
| `acc-fleet-private` | Prywatny bucket Storage ze zdjęciami, PDF-ami i fakturami |
| `acc_fleet_commit` | Zapis karty, historii i przypisania plików w jednej transakcji |

Migracja nie usuwa i nie zmienia tabel `tools`, `settings`, `history`. Dodaje restrykcyjną politykę Storage ograniczoną do nowego bucketa; istniejące buckety nie są przez nią blokowane.

**Nie wyłączaj RLS. Nie dodawaj polityk „wszyscy mogą wszystko”.** Nowe tabele są celowo niedostępne bezpośrednio dla przeglądarki. Operacje idą przez serwer aplikacji, który sprawdza konto, rolę i przypisanie pojazdu. Pliki trafiają do Storage przez krótkotrwałe uprawnienia do konkretnego pliku.

Gdy SQL zwróci błąd, zatrzymaj wdrożenie. Nie pomijaj fragmentów dotyczących uprawnień. Zapisz komunikat i sprawdź go przed dalszymi krokami.

## 4. Dodaj administratora floty

W **Supabase → Authentication → Users** utwórz użytkownika ze swoim adresem e-mail i silnym, unikalnym hasłem. Przy tworzeniu administracyjnym potwierdź adres odpowiednią opcją panelu. Nie ustawiaj hasła `1234`.

Następnie uruchom poniższe zapytanie, zastępując adres i nazwę swoimi wartościami:

```sql
INSERT INTO public.acc_fleet_members (user_id, display_name, role, active)
SELECT id, 'IMIĘ I NAZWISKO ADMINISTRATORA', 'admin', true
FROM auth.users
WHERE lower(email) = lower('ADMIN@TWOJA-DOMENA.PL')
ON CONFLICT (user_id) DO UPDATE
SET display_name = EXCLUDED.display_name, role = EXCLUDED.role, active = true;
```

Sprawdź, czy konto faktycznie pojawiło się w `acc_fleet_members`. Gdy SELECT nie znajdzie adresu w Auth, zapytanie nie doda żadnego wiersza. Samo istnienie konta Auth bez wpisu w tej tabeli nie daje dostępu do floty.

## 5. Dodaj konta pracowników

Dla każdej osoby, która ma samodzielnie dopisywać przebieg lub zgłaszać usterki, utwórz osobne konto Auth i wpis:

```sql
INSERT INTO public.acc_fleet_members (user_id, display_name, role, active)
SELECT id, 'IMIĘ I NAZWISKO PRACOWNIKA', 'worker', true
FROM auth.users
WHERE lower(email) = lower('PRACOWNIK@TWOJA-DOMENA.PL')
ON CONFLICT (user_id) DO UPDATE
SET display_name = EXCLUDED.display_name, role = EXCLUDED.role, active = true;
```

Administrator zarządza flotą, terminami, serwisami, kosztami i przypisaniem. Pracownik może oglądać dane operacyjne floty i zdjęcia, ale może dopisywać odczyty oraz zgłaszać usterki tylko w pojeździe przypisanym do jego konta. **Faktury, inne dokumenty, kwoty i pola administracyjne są przeznaczone dla administratora.** Nie wpisuj poufnych kwot do publicznego tytułu zdarzenia lub opisu usterki.

W tej wersji nie ma formularza tworzenia kont w samej aplikacji. Przycisk „Konta” pokazuje listę; konta i role zakłada administrator w Supabase. Osobę bez konta można przypisać po imieniu i nazwisku. To zapisuje posiadacza, ale nie daje jej prawa do samodzielnego zapisu.

Odebranie dostępu:

```sql
UPDATE public.acc_fleet_members SET active = false
WHERE user_id = 'UUID-KONTA-Z-TABELI-AUTH';
```

Wpisz rzeczywisty UUID, nie tekst przykładowy. Wyłączenie konta blokuje nowe żądania, ale nie usuwa wcześniej pobranych danych z cudzego urządzenia ani nie unieważnia natychmiast już wystawionego linku pliku (do 2 minut).

## 6. Ustaw zmienne w Vercel

W **Project → Settings → Environment Variables** ustaw dla właściwego środowiska:

| Nazwa | Wartość |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Adres projektu Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Klucz anon projektu; w istniejącym wdrożeniu już powinien być |
| `SUPABASE_SERVICE_ROLE_KEY` | Serwerowy klucz service_role tego samego projektu |

Klucze znajdziesz w ustawieniach API projektu Supabase. W tej wersji stosowane są nazwy zmiennych zgodne z dotychczasową aplikacją. Jeżeli panel pokazuje nowe rodzaje kluczy, odszukaj istniejący klucz anon i service_role używany dla tego projektu; nie zamieniaj ich miejscami.

**Klucz service_role nigdy nie może mieć prefiksu `NEXT_PUBLIC_`.** Nie wklejaj go do plików programu, czatu ani repozytorium. Ma pozostać wyłącznie w ustawieniach serwera/Vercel lub prywatnym `.env.local` na komputerze administratora. Ominięcie tego rozdzielenia może ujawnić całą bazę.

Dla Preview wpisz dane testowej bazy, dla Production dane produkcyjnej. Po zmianie zmiennych wykonaj nowy deployment. Same zapisane zmienne nie zmieniają już zbudowanej aplikacji.

## 7. Skonfiguruj odzyskiwanie hasła

W Supabase Authentication ustaw URL witryny i dozwolone przekierowanie kończące się na `/vehicles`, np.:

```text
https://ADRES-TWOJEJ-APLIKACJI/vehicles
```

Dla testów dodaj dokładny adres podglądu, nie dowolne obce domeny. Przycisk „Nie pamiętam hasła” korzysta z poczty Supabase Auth. Wysyłka wymaga działającej konfiguracji pocztowej i podlega jej limitom. To nie są wiadomości o terminach serwisów — tych aplikacja automatycznie nie wysyła.

## 8. Wykonaj build i sprawdź wersję próbną

Na komputerze z Node.js 22 i internetem, w katalogu projektu:

```sh
npm ci
npm run check:syntax
npm test
npm run typecheck
npm run build
```

Nie używaj `npm audit fix --force` jako przypadkowej naprawy: może zmienić wersje bibliotek poza zakresem tej modyfikacji. Po błędzie kompilacji zachowaj pełny komunikat. W repozytorium jest także workflow GitHub z kontrolą składni, testami, typami i buildem; jego poprawnego wykonania nie potwierdzono w środowisku przygotowania paczki.

Wejdź w podgląd Vercel i kliknij **Pojazdy** albo dopisz `/vehicles` do adresu. Logowanie flotowe jest również dostępne z ekranu logowania starej narzędziowni — nie trzeba najpierw wpisywać starego PIN-u.

## 9. Testy odbiorowe przed podmianą produkcji

Wykonaj na kopii, używając osobnych kont administratora i pracownika:

1. Dodaj testowy samochód, ustaw kilka niezależnych terminów, prześlij JPG i PDF, odśwież stronę. Sprawdź zachowanie wszystkich danych i działanie podglądu.
2. Ustaw kilometr serwisu poniżej bieżącego przebiegu i odległą datę. Alarm powinien być czerwony. Po wpisaniu nowego serwisu tylko zaznaczone czynności mają dostać nowe terminy.
3. Przekaż pojazd pracownikowi. Na jego koncie zapisz licznik i usterkę. Sprawdź brak faktur, kwot i administracyjnych dokumentów także w odpowiedziach API, a nie tylko na ekranie. Spróbuj zapisu cudzego pojazdu — serwer powinien odmówić.
4. Zapisz negatywny wynik badania technicznego. Pojazd ma być wyłączony z użytkowania, a termin nieprzedłużony. Zwrot do magazynu powinien pozostać możliwy. Zamknięcie usterki nie może samo przywracać statusu „Gotowy”.
5. Otwórz ten sam pojazd w dwóch przeglądarkach. Zapisz zmianę w pierwszej, potem spróbuj w drugiej bez odświeżenia. Drugi zapis ma być odrzucony jako konflikt. Zachowaj opis z formularza, zamknij go, odśwież kartę i dopiero wprowadź zmianę ponownie.
6. Odłącz internet przy zapisie. Nie może pojawić się fałszywe potwierdzenie. Ponowienie dokładnie tego samego zapisu po odzyskaniu połączenia nie powinno dopisać podwójnej faktury/zdarzenia.
7. Sprawdź podgląd PDF i zdjęcia z telefonu, pobranie CSV w Excelu, druk karty, wylogowanie i reset hasła. Testy z rzeczywistym Safari/iPhone i Chrome/Android są potrzebne; nie wykonano ich w paczce.
8. W Narzędziach/BHP: zanotuj liczbę PPE, zmień jedną osobę/budowę w ustawieniach i odśwież. PPE ma pozostać. Sprawdź dodawanie/edycję/zwrot narzędzia, przeglądy, awarie, QR i wydruki. Zwróć uwagę na wynik i typ starszych przeglądów.
9. Wyślij żądanie do nowych tabel oraz nowego bucketa bez sesji i bez API aplikacji. Dostęp ma być odrzucony. Nie rozwiązuj błędów przez upublicznienie bucketa lub wyłączenie RLS.

Po pomyślnym odbiorze wykonaj kopię produkcyjnej bazy, migrację i konfigurację kont w produkcyjnym projekcie, następnie opublikuj sprawdzony kod. Zapisz commit i datę wdrożenia.

## 10. Ważne ograniczenia i utrzymanie

**Stary PIN nie jest pełnym zabezpieczeniem serwerowym.** Nowy moduł nie naprawia automatycznie wszystkich zasad dostępu Narzędzi/BHP. W ZIP-ie nie było ich polityk RLS ani rzeczywistej konfiguracji bazy. Przed szerszym użyciem programu należy osobno sprawdzić i przebudować autoryzację starej części. Szczegóły w audycie.

Terminy są alarmami w aplikacji. Nie ma automatycznych SMS-ów, przypomnień e-mail, GPS, rozpoznawania faktur, połączenia z księgowością, ewidencji płatności ani podpisu elektronicznego odbiorcy. Protokół przekazania zapisuje administrator; nie jest to dwustronnie podpisane potwierdzenie.

Kwoty to wydatki brutto wpisane ręcznie; każda waluta liczona osobno. Brak kosztu nie jest kosztem zero. Unieważnienie wpisu usuwa go z sum kosztów, ale nie cofa licznika, terminu, statusu ani usterki — sprawdź je świadomie. Po korekcie lub wymianie licznika popraw również odpowiednie progi serwisowe.

Przyczepy lub maszyny mogą mieć numer flotowy zamiast rejestracji; pole VIN przyjmuje standardowe 17 znaków. Inny numer seryjny wpisz w uwagach lub numerze flotowym. Interwały dobierz na podstawie własnych dokumentów i specyfikacji; aplikacja nie ustala ich prawnie ani technicznie.

Załączniki: JPG, PNG, WEBP, PDF do 12 MiB na plik i do 12 plików we wpisie. Zdjęcia HEIC trzeba przekonwertować na JPG. Jest kontrola rozmiaru i sygnatury formatu, ale nie skaner antywirusowy. Zapisane dokumenty i historia nie mają przycisku trwałego usuwania; retencję i pomyłkowo dodane dokumenty obsługuje administrator bazy po weryfikacji.

Nieukończone załączniki starsze niż 48 godzin można przejrzeć ręcznie:

```sh
node --env-file=.env.local scripts/cleanup-fleet-uploads.mjs
```

Domyślnie to tylko raport. Po sprawdzeniu raportu `--apply` usuwa stare, niepowiązane pliki robocze. Nie dodano harmonogramu automatycznego. Skrypt nie porządkuje wszystkich możliwych osieroconych obiektów Storage, np. po usunięciu metadanych i awarii samego Storage; takie ścieżki są raportowane do obsługi administracyjnej. Nie uruchamiaj go równolegle z wielodniowo otwartymi formularzami.

Historia floty jest pobierana oddzielnie dla wybranego pojazdu, z odczytami bazy po 500 wierszy. Wynik API nadal obejmuje całą historię tego pojazdu; przy bardzo dużej liczbie wpisów potrzebna będzie paginacja także w API i archiwum raportowe. To nie jest implementacja nieograniczonego skalowania.

## Powrót do poprzedniej wersji

Powrót kodu do wcześniejszego commitu usuwa widoczność nowej zakładki, ale nie kasuje nowych tabel ani plików. Nie usuwaj ich od razu — mogą zawierać nowe dane. Stary kod zawiera błąd zapisu ustawień mogący nadpisać PPE, więc po rollbacku wstrzymaj edycję ustawień do czasu przywrócenia poprawki. Migracja jest addytywna, ale rollback kodu nie jest backupem danych.
