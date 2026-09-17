# ACC BAU Tools + BHP + Pojazdy
## Paczka zmian z 17.09.2026 — najpierw wdrożenie testowe

**To kod aplikacji, a nie kopia danych z Supabase. W czasie przygotowania tej paczki nie łączono się z Twoją bazą, GitHubem ani Vercel. Nie wykonano migracji i nie zmieniono żadnego wpisu w działającym programie.**

Wprowadzono zakładkę Pojazdy oraz poprawki ochrony zapisów w Narzędziowni i BHP. Wszystkie 24 pliki oryginalnego projektu pozostają w paczce; część z nich jest zaktualizowana. Wersje bibliotek i plik package-lock.json pozostawiono bez zmian.

### Zanim podmienisz działający program

Nie wgrywaj od razu na główną gałąź uruchamiającą produkcję. Najpierw utwórz gałąź, np. `pojazdy-preview`, i sprawdź Preview w Vercel. Pełnego builda Next.js ani testu na prawdziwym Supabase nie wykonano w środowisku przygotowania paczki — pobranie zależności npm blokował błąd DNS. Lista wykonanych testów i koniecznych testów wdrożeniowych jest w `docs/TESTY_PL.md`.

### Kolejność prac

1. **Kopia danych.** Zachowaj oryginalny ZIP i poprzedni działający deployment. Zrób osobną kopię bazy Supabase oraz plików Storage. ZIP z GitHuba, eksport CSV i eksport pojedynczego pojazdu NIE zastępują kopii bazy. Dane BHP w tej aplikacji są w `settings → main → data → ppeRecords`, a nie w osobnej tabeli.
2. **Kod i testy.** Wgraj zawartość folderu projektu do gałęzi testowej tego samego repozytorium Tools. Nie dodawaj nadrzędnego folderu ZIP-a jako kolejnego poziomu. Uruchom `npm ci`, `npm test`, `npm run check:source`, `npm run build` w środowisku z dostępem do npm.
3. **Baza i konfiguracja.** Po testach uruchom dołączoną migrację SQL oraz dodaj cztery nowe zmienne serwerowe do Vercel. Nie zastępuj istniejących publicznych kluczy Production innym projektem Supabase. Szczegóły są w `docs/WDROZENIE_POJAZDY_PL.md`.
4. **Odbiór.** Sprawdź stare narzędzia, BHP, pracowników, historię i zdjęcia. Przejdź scenariusze pojazdów na danych testowych. Dopiero po pozytywnym wyniku promuj sprawdzoną wersję do Production.

**Preview nie oznacza osobnej bazy.** Jeżeli Preview korzysta z produkcyjnych kluczy, kliknięcie Zapisz nadal zmieni dane w tej bazie. Do testów zapisów użyj odizolowanej bazy testowej. Docelowa produkcja ma pozostać przy dotychczasowym projekcie ACC BAU Tools.

### Cztery nowe zmienne

| Zmienna | Zawartość |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Serwerowy, uprzywilejowany klucz właściwego projektu Supabase. Nie klucz anon. |
| `FLEET_SESSION_SECRET` | Losowy sekret podpisu sesji, minimum 32 znaki. |
| `FLEET_BOOTSTRAP_USER` | Imię i nazwisko pierwszego administratora pojazdów. |
| `FLEET_BOOTSTRAP_PIN` | Jego początkowe hasło, minimum 8 znaków; zalecane losowe 16 lub więcej. |

Nie publikuj tych wartości w repozytorium, na zdjęciu ekranu ani w wiadomości. Nigdy nie dodawaj do ich nazw `NEXT_PUBLIC_`.

### Pierwsze uruchomienie

W dotychczasowej aplikacji wybierz **Pojazdy** i zaloguj się nowym kontem. Moduł floty ma osobne uwierzytelnianie serwerowe ze względu na faktury i koszty; stare logowanie do Narzędziowni/BHP nie zostało przeniesione ani skasowane. Dodaj pojazd, następnie zdjęcia i jego harmonogram. W Dostępach dodaj pozostałych użytkowników, najlepiej z dokładnie takimi nazwami jak na liście pracowników.

Po pierwszym poprawnym zalogowaniu usuń z Vercel `FLEET_BOOTSTRAP_USER` i `FLEET_BOOTSTRAP_PIN`, po czym wykonaj redeploy. Utworzone konto i jego hasło pozostają w bazie w postaci hasha.

### Najważniejsze zasady danych

W aplikacji używaj archiwizacji, nie fizycznego kasowania. Historia pojazdów jest dopisywana; korekta licznika nie usuwa pierwotnej wartości. Fakturę można dołączyć do naprawy również później. Migracja nie aktualizuje ani nie usuwa wierszy `tools`, `history`, `settings`.

Przed pierwszym nadpisaniem starego cache aplikacja próbuje zachować jego oryginał w przeglądarce. Gdy brakuje miejsca na tę kopię, pozostawia stary cache i pokazuje ostrzeżenie. W Ustawieniach jest przycisk pobrania tej lokalnej kopii. **To pomoc ratunkowa, nie pełny backup Supabase.** Nie odzyskuje danych usuniętych wcześniej, jeżeli nie ma ich w kopii.

### Pliki do przeczytania

`docs/WDROZENIE_POJAZDY_PL.md` — wdrożenie i konfiguracja.

`docs/RAPORT_ANALIZY_PL.md` — znalezione problemy, poprawki i rzeczy pozostałe do zrobienia.

`docs/OBSLUGA_POJAZDOW_PL.md` — korzystanie z nowych funkcji.

`docs/TESTY_PL.md` — wyniki sprawdzeń oraz testy wymagane przed produkcją.
