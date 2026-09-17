# Pojazdy — obsługa modułu

## Karta pojazdu

Po zalogowaniu wybierz Dodaj pojazd. Wymagane są rejestracja, marka i model. VIN może pozostać pusty; wpisany VIN podlega kontroli formatu 17 znaków. Dla maszyny bez rejestracji możesz użyć unikalnego oznaczenia wewnętrznego w polu rejestracji. Nie zmieniaj ID istniejącego pojazdu przez ręczne operacje w bazie.

Karta obejmuje nazwę, VIN, rok, kategorię, kraj, rodzaj paliwa, skrzynię, silnik, moc, DMC, ładowność, liczbę miejsc, rozmiar opon, firmę/właściciela, zakup, leasing/najem, ubezpieczyciela, numer polisy, assistance oraz notatki. Lokalizacja i budowa są wpisywane ręcznie — to nie GPS.

Przebieg początkowy jest opcjonalny, ale brak licznika powoduje ostrzeżenie. Zdjęcia dodaj po pierwszym zapisaniu pojazdu. W Dokumentach możesz wskazać zdjęcie główne. Stare zdjęcie nadal zostaje w galerii.

## Kto używa pojazdu

Użyj Przekaż / zmień użytkownika. Formularz zapisuje poprzedniego i nowego kierowcę, datę, licznik, projekt, lokalizację, notatki i zdjęcia. Puste pole kierowcy oznacza zwrot bez przypisania. Aktualne przekazanie zapisuje się z dzisiejszą datą, aby stary wpis nie zmieniał przypadkowo dzisiejszego użytkownika.

Kierowcę można wpisać z listy dotychczasowych pracowników. Aby ta osoba korzystała z modułu, musi mieć też aktywne konto floty z dokładnie taką samą nazwą. Pracownik nie widzi całej floty ani faktur; administrator widzi wszystko.

## Przebieg

Przycisk Dodaj przebieg dopisuje odczyt, a nie zastępuje historii. Podaj licznik z określonego dnia, w pełnych kilometrach. System sprawdza zgodność z wcześniejszymi i późniejszymi odczytami. Można dopisać starą fakturę lub odczyt historyczny, o ile nie przeczy innym datom. Taki wpis nie cofa bieżącego licznika.

Dla kilku odczytów tego samego dnia bieżący licznik wynika z najwyższej wartości. Program nie zapisuje godzin samego odczytu — godzinę ma operacja dodania wpisu. Dla szczegółowego rozliczania wielu zmian kierowców jednego dnia należy później dodać czas zdarzenia.

Błędny licznik popraw przyciskiem Korekta w historii. Wymagane jest uzasadnienie. Oryginalny wpis pozostaje widoczny, a korekta jest osobnym zdarzeniem. **Korekta odczytu nie przelicza wstecz już zapisanych terminów serwisowych.** Sprawdź je i w razie potrzeby użyj Edytuj termin, również z uzasadnieniem.

Brak aktualizacji licznika przez ponad 30 dni daje ostrzeżenie. Próg serwisu według km jest tylko tak aktualny jak ostatni wpisany odczyt; nie ma automatycznego pobierania danych z samochodu.

## Terminy i harmonogram

W Terminy dodaj osobne pozycje: przegląd techniczny, ubezpieczenie, olej, filtr oleju, powietrza, kabinowy, paliwa, rozrząd, płyn hamulcowy, opony, tachograf, gaśnica lub własna czynność.

Dla każdej pozycji wpisujesz termin datą, przebiegiem albo oboma warunkami. Obowiązuje warunek, który nadejdzie wcześniej. Program nie narzuca przepisów danego kraju ani uniwersalnych interwałów — przepisz wymagania z dokumentów pojazdu, badania, umowy lub instrukcji producenta.

Przykład: olej do 15.03.2027 **lub** przy 180 000 km. Alert pojawi się także wtedy, gdy samochód osiągnie 180 000 km wcześniej. Domyślne ostrzeganie wynosi 30 dni / 1500 km, ale można je zmienić dla każdej pozycji. Są to progi ostrzeżeń, nie interwały wymiany.

Termin dzisiejszy jest wyróżniony jako zbliżający się/wymagający uwagi. Przekroczona data lub osiągnięty limit km daje alert przeterminowania. Brak informacji o liczniku albo brak nowego terminu nie jest pokazywany jako pełne „OK”.

Edytuj termin pozwala poprawić datę, przebieg i interwał z uzasadnieniem. Poprzedni plan jest zachowany w zdarzeniu historii. Archiwizacja wyłącza plan z aktywnych alarmów, ale nie usuwa go.

**Alerty działają w aplikacji. Ta wersja nie wysyła automatycznych e-maili, SMS-ów ani WhatsApp.**

## Serwis i naprawy

Wybierz Serwis / naprawa i określ rodzaj wpisu: serwis, naprawa albo przegląd techniczny. Uzupełnij datę faktycznej pracy, licznik, opis, warsztat, koszt, walutę, netto/brutto i numer faktury. Dołącz dokumenty lub zdjęcia.

Zaznacz dokładnie te czynności harmonogramu, które zostały wykonane. Tylko one otrzymają następny termin. Pozostałe filtry/przeglądy nie zostaną automatycznie uznane za wykonane. Kliknięcie Serwis z konkretnego planu wstępnie zaznacza tę czynność.

Nowy termin jest wyliczany od daty/licznika tego serwisu według wprowadzonego interwału. Możesz podać inne wartości wynikające np. z dokumentu badania. Przy braku interwału i nowego terminu pozycja otrzyma ostrzeżenie o brakujących danych, zamiast fikcyjnej daty.

Jeżeli dodajesz stary serwis, a w historii jest już nowsze wykonanie tej samej czynności, dopisz historyczny wpis bez odhaczania aktualizacji tego planu. Zapobiegnie to cofnięciu harmonogramu.

## Faktura przyszła później

Otwórz Historię, odszukaj naprawę i wybierz **Dołącz FV / pliki**. Dokument zostanie skojarzony z tą naprawą oraz odnotowany jako osobny wpis. Oryginalna naprawa i wcześniejsze załączniki pozostają nienaruszone.

Formaty: PDF, JPG, PNG, WEBP; limit 20 MiB na plik, maksymalnie 20 plików na jedną operację. Zdjęcia kategorii Foto mogą być zmniejszane przed pierwszym wysłaniem. Skany faktur i dokumenty nie są kompresowane przez tę funkcję. HEIC, DOCX i XLSX nie są obsługiwane w tej wersji — zapisz dokument jako PDF lub obraz.

Pliki są przechowywane prywatnie, a podgląd otrzymuje krótki link po sprawdzeniu uprawnień. Uprawniony użytkownik nadal może pobrać i przekazać dokument dalej; aplikacja nie jest systemem DRM ani skanerem antywirusowym.

Wysyłanie plików jest osobnym krokiem. Jeżeli zamkniesz formularz po udanym przesłaniu pliku, ale przed zapisaniem serwisu, plik pozostanie w Dokumentach jako niepowiązany. Można go później wybrać w formularzu — nie trzeba go kasować ani przesyłać ponownie.

## Usterki i wyłączenie z używania

Kierowca może zgłosić usterkę z opisem i zdjęciem. Pilna usterka ustawia pojazd jako wyłączony z użytkowania. Administrator może zamknąć zgłoszenie z uzasadnieniem. Samo zamknięcie nie włącza automatycznie samochodu do ruchu; administrator osobno zmienia status po sprawdzeniu pojazdu.

Program ewidencjonuje decyzje. Nie zastępuje oceny stanu technicznego ani dopuszczenia pojazdu przez odpowiednią osobę.

## Koszty, wyszukiwanie i eksport

Filtry obejmują aktywne/archiwalne pojazdy, wymagające uwagi, bez kierowcy, z nieaktualnym licznikiem, kategorię, status i kierowcę. Wyszukiwarka szuka także VIN, rejestracji, projektu i lokalizacji.

Koszty są sumowane osobno dla każdej waluty oraz netto/brutto. Nie ma automatycznego kursu walut, księgowania VAT ani przeliczania netto na brutto. W tej wersji nie ma też korekty kosztu historycznej naprawy — błędną kwotę trzeba odnotować i obsłużyć w kolejnym etapie, bez ręcznego kasowania historii. Sprawdź kwotę przed zapisem.

Eksport CSV dotyczy przefiltrowanej listy. Karta do wydruku może być zapisana jako PDF funkcją przeglądarki. Eksport JSON karty obejmuje metadane i historię, ale bez zawartości plików. Żaden z tych eksportów nie jest kompletnym backupem aplikacji.

## Archiwum

Pojazdu nie kasujemy. Podaj powód archiwizacji, np. sprzedaż lub zakończenie wynajmu. Pojazd, jego dokumenty, przebieg, naprawy i koszty pozostaną w Archiwum. Można go przywrócić. Ten sam VIN pozostaje unikalny również w archiwum; zamiast tworzyć duplikat, odszukaj istniejącą kartę.

## Błąd zapisu

Zamknięcie formularza następuje po potwierdzeniu zapisu. Przy błędzie sieci ponów tę samą operację — formularz zachowuje jej identyfikator. Gdy pojazd zmienił ktoś na drugim urządzeniu, odśwież rekord przyciskiem w formularzu, sprawdź swoje wartości i dopiero zapisz. Nie zamieniaj rzeczywistego konfliktu w wymuszone nadpisanie.
