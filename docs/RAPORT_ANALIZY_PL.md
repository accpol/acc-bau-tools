# ACC BAU Tools — analiza kodu i zakres zmian
**17.09.2026 | Narzędziownia, BHP i nowy moduł Pojazdy**

## Zakres i stan prac

Przeanalizowano kod z `acc-bau-tools-main.zip`. Zmiany wykonano w kopii tego projektu. Nie odczytywano ani nie zmieniano produkcyjnej bazy, plików Storage, repozytorium GitHub ani ustawień Vercel. Nie sprawdzono rzeczywistych polityk dostępu RLS, schematu istniejącej bazy, liczby zapisanych pozycji ani jakości danych.

Paczka jest kandydatem do wdrożenia testowego. Testy logiki zakończyły się powodzeniem, ale pełny build Next.js, interfejs w przeglądarce, migracja PostgreSQL i rzeczywiste operacje Supabase wymagają jeszcze sprawdzenia. Dokładny zakres w `TESTY_PL.md`.

## Najważniejszy znaleziony błąd: zapis ustawień mógł usunąć BHP

W oryginalnym `app/page.tsx`, funkcja `SettingsModal.save()` tworzyła nowy obiekt ustawień zawierający tylko wybrane pola. Pomijała `ppeRecords`, czyli listę wyposażenia BHP zapisywaną w `settings → main → data`. Zapis tak przygotowanego obiektu mógł zastąpić ustawienia razem z listą BHP.

Dodano zachowanie istniejącego obiektu oraz bezpieczne łączenie zmian z najnowszym stanem z bazy. Nieobecność starego pola w formularzu nie oznacza jego skasowania. Test wykonuje rzeczywistą funkcję zapisu wyodrębnioną z pliku aplikacji: sprawdza zachowanie BHP i nieznanych pól oraz brak zamknięcia formularza po nieudanym zapisie.

**Ta poprawka nie odzyska automatycznie wpisów usuniętych przed jej wdrożeniem.** Do odzyskania potrzebna jest wcześniejsza kopia bazy albo zachowany cache konkretnej przeglądarki.

## Pozostałe zmiany ochronne w Narzędziowni i BHP

| Problem w kodzie źródłowym | Zmiana w paczce | Ograniczenie / uwaga |
|---|---|---|
| Błąd odczytu mógł być potraktowany jak pusta baza | Jawna obsługa błędów, brak automatycznego zapisu pustych ustawień przy inicjalizacji | Nie jest to pełny tryb pracy offline |
| Formularz pokazywał zmianę przed potwierdzeniem zapisu | Zapis narzędzia i ustawień/BHP wymaga potwierdzenia bazy | Stary zapis historii nadal nie jest jedną transakcją z zapisem narzędzia |
| Dwa komputery mogły nadpisać wspólne ustawienia/BHP | Łączenie zmian względem wersji formularza, zachowanie obcych pól i kontrola konfliktu | Mechanizm wymaga sprawdzenia z rzeczywistym typem kolumny `data` i ustawieniami API |
| `upsert` nowego narzędzia mógł zastąpić pozycję o tym samym ID | Nowe narzędzie używa `insert`, a ID istniejącego narzędzia jest nieedytowalne | Duplikat jest błędem, a nie automatycznym nadpisaniem |
| Fizyczne usuwanie pozycji narzędzi i BHP | Archiwizacja i przywracanie, osobny widok archiwum | Przeniesienie do archiwum ukrywa pozycję na aktywnej liście; nie usuwa jej |
| Usuwanie wpisu przeglądu narzędzia | Oznaczenie jako anulowany z powodem; wpis i załączniki pozostają | Nie oznacza edycji oryginalnej historii |
| Historia była ograniczana do fragmentu i niepoprawnie sortowana po lokalnych datach | Pełne pobieranie po otwarciu historii, zachowanie wcześniejszego cache, poprawione sortowanie | Początkowy podgląd przy starcie nadal pobiera ograniczony fragment |
| „Optymalizacja” zdjęć mogła bezpowrotnie zastąpić oryginały | Usunięto operację masowego zmniejszania starych danych | Nie przeniesiono starych zdjęć base64 do nowego magazynu |
| Nadpisanie jedynej lokalnej kopii po uruchomieniu nowej wersji | Przed pierwszym zapisem cache próba zachowania oryginału; przy braku miejsca stary cache nie jest nadpisywany | Lokalna kopia nie zastępuje backupu Supabase |

W Ustawieniach dodano pobranie lokalnej kopii ratunkowej. Plik może zawierać dane pracowników i stare ustawienia z PIN-ami — należy przechowywać go prywatnie. Zachowanie cache ma charakter pomocniczy; nie zapewnia synchronizacji wielu urządzeń ani odzyskania wszystkich danych.

## Nowa zakładka Pojazdy — zakres wdrożony w kodzie

### Karta pojazdu

Rejestracja, marka, model, VIN, rok, kategoria, kraj, paliwo, skrzynia, silnik, moc, masy, ładowność, miejsca, opony, firma/własność, zakup, leasing, ubezpieczyciel, numer polisy, assistance, budowa/lokalizacja, notatki i status. Dane finansowe są oddzielone uprawnieniami od widoku kierowcy. Galeria pozwala wskazać zdjęcie główne.

VIN jest unikalny także w archiwum. Aktywny numer rejestracyjny jest sprawdzany bez spacji i znaków rozdzielających. Nie ma integracji z zewnętrznym rejestrem pojazdów ani automatycznego odczytu VIN.

### Kierowcy i przebieg

Przypisanie pojazdu, historia poprzedniego i nowego użytkownika, licznik przy przekazaniu, lokalizacja i zdjęcia. Pracownik widzi aktualnie przypisane mu pojazdy, może wprowadzić przebieg i zgłosić usterkę. Nazwy kierowców i kont powinny być identyczne.

Przebieg jest historią odczytów, a nie jedną liczbą bez śladu zmian. Wpis wsteczny jest kontrolowany względem odczytów przed i po jego dacie. Korekta wymaga powodu i tworzy nowy wpis z odniesieniem do starego. Oryginał zostaje. Odczyty nie mają osobnej godziny zdarzenia; dla jednego dnia bieżący stan wyznacza największa efektywna wartość.

Korekta licznika nie przelicza automatycznie wcześniej zatwierdzonych harmonogramów serwisowych. Po takiej korekcie trzeba sprawdzić ich wartości.

### Serwisy, naprawy i terminy

Historia wykonanych prac z warsztatem, datą, przebiegiem, opisem, kosztem, walutą, rodzajem kwoty netto/brutto, numerem faktury i załącznikami. Fakturę można dołączyć później do istniejącej naprawy: powstaje dodatkowy wpis, bez zastąpienia oryginału.

Osobne harmonogramy m.in. przeglądu technicznego, ubezpieczenia, oleju, filtrów oleju/powietrza/kabinowego/paliwa, rozrządu, płynu hamulcowego, opon i innych czynności. Warunek może dotyczyć daty, przebiegu albo obu naraz. Liczy się próg, który zostanie osiągnięty wcześniej.

Interwały wpisuje administrator na podstawie właściwych wymagań pojazdu i dokumentów. Program nie narzuca terminów prawnych ani producenta. Po serwisie przesuwają się tylko czynności oznaczone jako wykonane; edycja harmonogramu wymaga powodu i zachowuje poprzednie dane w historii.

Pulpit pokazuje terminy przekroczone i zbliżające się, brak potrzebnych danych i dawno nieaktualizowany przebieg. **Nie dodano wysyłania e-maili, SMS-ów ani WhatsAppa.**

### Usterki, dokumenty i koszty

Zgłoszenie usterki z pilnością i zdjęciami. Krytyczna usterka oznacza pojazd jako wyłączony z użytkowania. Zamknięcie zgłoszenia nie przywraca automatycznie statusu „gotowy” — wymaga świadomej decyzji administratora.

Pliki JPEG, PNG, WEBP i PDF; limit 20 MiB na plik oraz 20 załączników na pojedynczą operację. Nowe fotografie w kategorii „zdjęcie” mogą być zmniejszane przed wysłaniem. Faktury nie są w ten sposób kompresowane. Plik wysłany przed anulowaniem formularza pozostaje w dokumentach; nie jest fizycznie usuwany.

Koszty są sumowane osobno dla walut i kwot netto/brutto, bez przeliczania kursów i bez automatycznego rozliczania VAT. W tej wersji nie ma osobnej korekty historycznej kwoty kosztu. Dostępne są wydruk karty, CSV listy i eksport JSON karty/historii/metadanych. Eksport JSON **nie zawiera bajtów zdjęć i faktur**.

## Architektura bezpieczeństwa nowego modułu

Pojazdy korzystają z nowych tabel `acc_fleet_*`, a nie z przebudowy `tools`, `history` czy `settings`. Migracja nie aktualizuje ani nie usuwa wierszy starego programu. Nowa historia jest dopisywana; zapis pojazdu, zdarzenia i powiązań plików ma być wykonywany w jednej transakcji PostgreSQL, z kontrolą wersji i zabezpieczeniem przed powtórzonym żądaniem. Mechanizm SQL trzeba potwierdzić w teście integracyjnym.

Faktury i zdjęcia floty trafiają do nowego, prywatnego magazynu plików. Dostęp do linku wymaga autoryzacji w API; link jest krótkotrwały. Nie jest to zabezpieczenie przed skopiowaniem dokumentu przez uprawnioną osobę ani system antywirusowy.

Nowy moduł ma osobne konta administrator/pracownik i sesje serwerowe. Hasła są hashowane z losową solą; role odczytywane z bazy. Zmiana roli lub dezaktywacja unieważnia poprzednie sesje. Ograniczanie prób logowania zapisuje stan w bazie.

**Dlaczego osobne logowanie?** Stary program sprawdza PIN i rolę w przeglądarce. Dodanie do takiego samego mechanizmu faktur stworzyłoby fałszywe poczucie poufności. Nie zmieniano hurtowo istniejących kont i loginów, aby nie odciąć pracowników od Narzędziowni/BHP.

## Co nadal wymaga poprawy — kolejność rekomendowana

**1. Rzeczywisty audyt dostępu starej bazy i wspólne uwierzytelnianie.** Sprawdzić polityki RLS oraz publiczne/anon uprawnienia do `tools`, `history`, `settings` i istniejących plików. Stare PIN-y, role w przeglądarce i dane konfiguracyjne nie zostały zamienione na serwerowe uwierzytelnianie. Nie należy zakładać, że nowy moduł zabezpieczył także starą część aplikacji.

**2. Transakcyjny zapis starej historii i podpisywane przekazania QR.** Zapis narzędzia oraz zapis historii nadal mogą udać się niezależnie. Stare funkcje historii nie zawsze czekają na potwierdzenie przed aktualizacją widoku. QR przekazania jest nadal danymi po stronie klienta, a nie jednorazowym, podpisanym zleceniem kontrolowanym przez serwer.

**3. Załączniki i wydajność starego programu.** Duże obrazy base64 są nadal przechowywane tak jak wcześniej. Bezpieczne przeniesienie wymaga migracji z kopią oryginałów i sprawdzeniem kompletności każdego pliku. Nie wykonywano go przy okazji dodania pojazdów. Przy bardzo dużych zbiorach floty także warto zastąpić pełne pobieranie list filtrowaniem i stronicowaniem serwerowym.

**4. Dalsza kontrola alertów i eksportów.** Stary algorytm terminów przeglądów narzędzi nie został w całości przebudowany; trzeba rozstrzygnąć, które historyczne terminy mają być nadal aktywne. Stare szablony wydruków i eksportów wymagają pełnego audytu kodowania danych użytkownika. Nowy wydruk floty i CSV mają własne zabezpieczenia, ale nie przeniesiono ich automatycznie do wszystkich starych szablonów.

**5. Następny etap funkcjonalny floty.** Automatyczne powiadomienia z potwierdzeniem odpowiedzialnego, tankowania i zużycie paliwa, koszty kilometra, osobne korekty kosztów, integracja GPS oraz wspólny panel terminów Narzędzia/BHP/Pojazdy. Tych elementów nie należy uznawać za wykonane w tej paczce.

## Odbiór przed produkcją

Najpierw kopia bazy i plików, następnie izolowane środowisko testowe, pełny build, migracja, testy ról i plików, oraz porównanie liczby i skrótów starych rekordów przed i po migracji. Dołączono zapytanie tylko do odczytu `supabase/verify_legacy_readonly.sql`. Identyczne wyniki są użyteczne tylko wtedy, gdy w czasie porównania nikt nie zmienia danych. Nie zastępują kopii bezpieczeństwa ani testu wszystkich funkcji.

Nie wolno usuwać nowych tabel ani magazynu plików jako „sprzątania” przy wycofaniu wdrożenia. Powrót do starego kodu nie powinien niszczyć danych wpisanych do floty. Szczegółowa kolejność i ostrzeżenie o powrocie starego błędu BHP są w `WDROZENIE_POJAZDY_PL.md`.
