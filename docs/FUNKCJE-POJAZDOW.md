# Pojazdy — codzienna obsługa

## Co widzisz po wejściu

Pulpit pokazuje liczbę aktywnych pojazdów, pojazdy z osiągniętym terminem, zbliżającymi się czynnościami, usterkami i brakami danych. Kliknięcie kafelka filtruje listę. Można szukać po rejestracji, numerze flotowym, VIN, marce, modelu, użytkowniku, budowie i lokalizacji. Są filtry rodzaju, kierowcy, „Moje pojazdy” i archiwum.

Po lewej jest lista, po prawej karta. Na telefonie karta zastępuje listę; przycisk „Lista pojazdów” wraca do wyszukiwania. Dane odświeżają się co minutę i po powrocie do karty przeglądarki, gdy nie jest otwarty formularz. To odświeżanie w aktywnej aplikacji, nie serwis wysyłający powiadomienia w tle.

## Karta pojazdu

Obsługiwane rodzaje: osobowy, bus, ciężarowy, przyczepa/naczepa, dźwig, maszyna i inne. Rejestrację można zastąpić numerem flotowym, np. dla niezarejestrowanej maszyny. Dostępne są VIN, marka/model, rok, firma, kraj, własność/leasing/wynajem, napęd, silnik, moc, DMC, opony, specyfikacja i ilość oleju oraz data pierwszej rejestracji.

Licznik może być kilometrowy, motogodzinowy, oba jednocześnie albo żaden. Nieznaną wartość zostaw pustą. Lokalizacja i budowa są wpisywane ręcznie — aplikacja nie pobiera pozycji GPS.

Zdjęcia ogólne, wnętrze i wyposażenie dodajesz przez „Dodaj zdjęcia / dokumenty”. Są podglądy zdjęć i PDF, załączniki do konkretnych wpisów historii, eksport CSV i wydruk karty do drukarki lub funkcji „Zapisz jako PDF” przeglądarki. Wydruk zawiera ostatnie 30 zdarzeń; całą historię można wyeksportować do CSV.

## Pierwsze dodanie

Kliknij „Dodaj pojazd”, wpisz przynajmniej rejestrację/numer flotowy, markę i model. Ustaw rodzaj licznika uważnie: po utworzeniu nie zmienia się go zwykłą edycją, żeby nie mieszać historii kilometrów i godzin. Następnie dodaj zdjęcia, użytkownika oraz realne terminy z dokumentów.

Powstają domyślne pozycje: badanie techniczne/HU, OC, olej z filtrem oleju, filtr powietrza, paliwa i kabinowy. Dla napędu elektrycznego/braku silnika lub pozycji bez licznika nie są automatycznie zakładane te spaliniowe pozycje serwisowe. W razie potrzeby dodaj właściwe czynności ręcznie. Aplikacja nie zgaduje interwałów ani terminów.

## Terminy — data, kilometry i godziny

Każda czynność ma swoją nazwę, typ i niezależne progi. Możesz zdefiniować np. olej silnikowy, filtr paliwa, rozrząd, olej skrzyni, hamulce, opony, OC/AC, badanie techniczne, tachograf, gaśnicę, badanie dodatkowe czy koniec gwarancji/leasingu.

Przykład wyłącznie ilustrujący działanie programu, nie zalecenie producenta:

```text
Olej + filtr:
  następna data:   15.03.2027
  następny licznik: 150 000 km
  ostrzegaj:        30 dni lub 1 000 km wcześniej
```

Jeżeli licznik wyniesie 150 000 km przed marcem, alarm już jest aktywny. Jeżeli przyjdzie wyznaczona data wcześniej, również jest aktywny. Działa pierwsza osiągnięta granica. Motogodziny działają analogicznie.

Brak terminu lub odczytu daje informację o brakujących danych, nie zielone „OK”. Odczyt starszy niż 14 dni powoduje ostrzeżenie o nieaktualnym liczniku. Pozycję niepasującą do pojazdu można wyłączyć z podaniem powodu. To nie usuwa historii.

Pola „Powtarzaj co…” określają, jak wyznaczyć następny termin po wykonaniu. Same w sobie nie są aktualnym terminem; uzupełnij także „Następny termin”.

## Serwis, naprawa i faktura

Kliknij „Serwis / naprawa”. Wpisz datę wykonania, odczyt z tej daty, tytuł, opis prac, warsztat, części, koszt brutto, walutę i numer faktury. Dołącz PDF lub zdjęcie faktury. Brak faktury przy koszcie jest oznaczony na zestawieniu kosztów.

Zaznacz wyłącznie czynności, które rzeczywiście wykonano. Program wyliczy kolejny termin od daty i licznika wykonanego serwisu według ustawionego interwału. Możesz skorygować następny próg ręcznie. Wymiana filtra powietrza nie przesuwa samoczynnie terminu OC lub badania technicznego.

Gdy czynność nie ma interwału i nie wpiszesz następnego progu, po wykonaniu powstanie brak kolejnego terminu do uzupełnienia. Program nie zakłada, że stary, już wykorzystany termin nadal obowiązuje.

Naprawę niezwiązaną z żadnym harmonogramem zapisujesz bez zaznaczania czynności. Starszy serwis można dopisać do historii; nie zamykaj nim harmonogramu, którego późniejsze wykonanie już zapisano. Tankowanie/ładowanie i notatka nie zamykają przeglądów.

## Badanie techniczne

Wybierz rodzaj wpisu „Badanie techniczne” i jawnie wskaż wynik. Pozytywny wynik może zamknąć zaznaczoną pozycję harmonogramu. Negatywny nie przedłuży terminu: wyłącza pojazd i otwiera usterkę krytyczną.

Przy dopisywaniu dawnych negatywnych wyników również powstaje blokada do świadomego wyjaśnienia przez administratora. Program nie zakłada, że problem został rozwiązany tylko dlatego, że data jest stara.

## Przekazanie / zwrot

Administrator wskazuje nowego użytkownika albo zwrot bez użytkownika. Przy przekazaniu zapisuje się dotychczasowy i nowy posiadacz, data, odczyt licznika, stan paliwa, budowa/lokalizacja, odnotowane wyposażenie, uwagi i zdjęcia stanu pojazdu. Przypisanie do konta pracownika daje mu prawo do dopisywania odczytów i zgłaszania usterek tego pojazdu.

Osobę zewnętrzną można wpisać ręcznie. Historia ją zachowa, ale nie tworzy to konta. Przekazanie zatwierdza administrator — ta wersja nie pobiera podpisu odbiorcy ani jego osobnego potwierdzenia.

Pojazdu z otwartą usterką krytyczną lub statusem „w serwisie”/„wyłączony” nie można wydać. Nadal można przyjąć jego zwrot. Zbliżające się lub osiągnięte terminy są ostrzeżeniami; aplikacja nie zastępuje decyzji o faktycznej sprawności i dopuszczeniu pojazdu.

## Usterki i powrót do użytkowania

Administrator i przypisany pracownik mogą zgłosić problem z opisem, priorytetem i zdjęciem. Krytyczny problem wyłącza pojazd. Administrator zapisuje naprawę, następnie zamyka odpowiednie zgłoszenie i osobno zmienia status pojazdu.

Sam wpis kosztu naprawy, zamknięcie pojedynczej usterki lub dodanie późniejszego badania nie oznacza automatycznie, że wszystkie problemy zostały usunięte. Przy innych otwartych usterkach krytycznych nie można przywrócić gotowości.

## Liczniki, błędy i koszty

Zwykły odczyt nie może cofać licznika ani przeczyć odczytom z wcześniejszych/późniejszych dni. Przy historycznym wpisie wymagany jest odczyt z tamtego okresu, nie dzisiejsza wartość. Korekta po błędzie lub wymianie licznika jest tylko dla administratora, wymaga powodu i dzisiejszej daty. Korekta nie przelicza samoczynnie progów serwisowych.

Błędną fakturę/koszt można oznaczyć „Unieważnij błędny wpis”. Pozostaje ślad, kto i dlaczego to zrobił. Suma kosztów pomija unieważniony wpis, ale licznik, harmonogram i usterki nie są cofane. Popraw je oddzielnie, a następnie dodaj prawidłowy wpis.

PLN, EUR i pozostałe obsługiwane waluty sumowane są oddzielnie. Nie ma automatycznego przeliczania kursów ani potwierdzania, czy faktura została zapłacona. To nie jest pełny rachunek kosztu posiadania pojazdu.

## Archiwum i uprawnienia

Sprzedany lub wycofany pojazd trafia do archiwum. Przed archiwizacją trzeba odnotować zwrot od użytkownika. Historia i dokumenty pozostają; administrator może przywrócić kartę. Nie ma przycisku trwałego skasowania samochodu wraz z historią.

Pracownik nie widzi faktur, innych administracyjnych dokumentów i kwot; ma podgląd danych operacyjnych oraz zdjęć. Pole „tytuł”, opisy usterek i dane przekazania są operacyjne, dlatego nie umieszczaj w nich poufnych informacji finansowych. Bardziej szczegółowy podział ról nie jest częścią tej wersji.
