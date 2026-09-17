# Audyt i zmiany w ACC BAU Tools

**Źródło:** przesłany `acc-bau-tools-main.zip`.
**Wynik prac:** kod 0.2.0 z modułem Pojazdy i ograniczonymi poprawkami starej części.
**Data:** 17.09.2026.

## 1. Wniosek dla właściciela

Program ma już wiele potrzebnych operacji — narzędzia, pracowników, budowy, przeglądy, PPE, historię i QR — ale stara część łączy prawie wszystko w jednym pliku `app/page.tsx`. Ważniejsze od dodania następnych przycisków są: pewność zapisu, ochrona przed nadpisaniem danych, jednoznaczne terminy oraz rzeczywiste uprawnienia po stronie serwera.

Nowe Pojazdy zostały wydzielone, zamiast dopisywać kolejne tysiące linii do głównego ekranu. Zapis floty korzysta z osobnego API i transakcji. **Nie oznacza to jednak, że cała istniejąca aplikacja jest już bezpieczna lub w pełni przebudowana.** Nie otrzymano polityk RLS, eksportu bazy, konfiguracji Auth ani Storage. Nie zweryfikowano działającej instalacji.

## 2. Znalezione problemy i wykonane poprawki

Odwołania dotyczą funkcji w oryginalnym `app/page.tsx`; numery linii zmieniły się po poprawkach.

| Problem w źródle | Znaczenie w praktyce | Zmiana w tej paczce |
|---|---|---|
| `SettingsModal.save` konstruuje nowe ustawienia bez `ppeRecords`, po czym zastępuje cały rekord `settings/main` | Zapis pracowników/budów może usunąć dane PPE z tego rekordu | Zachowanie pól, zapis wyłącznie zmienianych obszarów, porównanie ze stanem odczytanym wcześniej i kontrola rewizji przy zapisie |
| `persistSettingsEverywhere` najpierw zapisuje lokalnie i aktualizuje ekran, dopiero później bazę | Interfejs może sugerować sukces mimo błędu serwera | Przy połączeniu z Supabase najpierw potwierdzenie bazy, dopiero później ekran/cache |
| `initApp` wybiera starszą lub lokalną kopię ustawień według heurystyki i potrafi wysłać ją przy otwarciu strony | Telefon/komputer może nadpisać wspólne ustawienia swoim cache | Samo otwarcie strony nie wysyła już lokalnych ustawień do bazy; stan serwera ma pierwszeństwo |
| Odpowiedzi Supabase w `initApp` nie mają sprawdzonych pól `error` | Błąd dostępu może wyglądać jak pusta poprawna baza | Sprawdzanie błędów odpowiedzi przed oznaczeniem połączenia jako poprawnego |
| `saveTool`, `updateTool`, usuwanie sprzętu zmieniają ekran przed zapisem; część operacji ignoruje błędy | „Zapisane” dane mogą zniknąć po odświeżeniu | Zapis/usunięcie najpierw w bazie, sprawdzenie wyniku, dopiero aktualizacja widoku; błąd nie zamyka formularza sprzętu/przeglądu/awarii |
| `saveTool` stosuje `upsert` także dla nowego sprzętu; ID jest edytowalne | Możliwe nadpisanie istniejącego sprzętu albo utworzenie drugiego rekordu zamiast edycji | Nowy rekord przez INSERT, istniejący przez UPDATE, kontrola powtórzonego ID i zablokowane ID w edycji |
| Formularz PPE zamyka się bez oczekiwania na zapis | Po błędzie trzeba ponownie wpisywać dane, użytkownik nie wie o niepowodzeniu | Oczekiwanie na wynik; zamknięcie wyłącznie po potwierdzeniu; blokada równoległego zapisu PPE |
| `isServiceRecord` uznaje każdą wykonaną czynność bez następnej daty za serwis | Przegląd z brakującą datą może zniknąć z ostrzeżeń | Brak daty nie zmienia już typu czynności; taki przegląd wymaga reakcji |
| `urgentInspection` analizuje wszystkie historyczne daty, a `hasPermanentInspectionOk` może globalnie ukryć ostrzeżenia | Stary przeterminowany przegląd alarmuje mimo nowszego, albo „nie wymaga” ukrywa aktualny problem | Najnowszy wpis danego typu, niezależne typy, kontrola wyniku negatywnego; „nie wymaga” nie zasłania istniejących zwykłych przeglądów |
| UTC w datach dnia i `setMonth` z końcówką miesiąca | Data może przesunąć się przy północy; 31 stycznia + miesiąc może wyjść w marcu | Wspólna data Europe/Berlin i ograniczenie dnia do końca docelowego miesiąca |
| `log` / `saveHistoryItem` pokazują wpis przed potwierdzeniem zapisu historii | Historia wygląda na zapisaną, choć istnieje tylko w pamięci | Najpierw zapis; przy błędzie wyraźna informacja o możliwym częściowym powodzeniu operacji; brak tworzenia kodu przekazania bez zapisanej historii |
| Eksport „Excel” składa HTML z niesanitowanych danych i nadaje rozszerzenie XLS | To nie jest prawdziwy plik XLS; ryzyko niepożądanej interpretacji danych | Eksport CSV UTF-8 z zabezpieczeniem przed formułami i prawidłowym cytowaniem komórek |
| Szablony wydruków wstawiają dane do HTML bez jednolitego kodowania | Ryzyko aktywnej zawartości w nowej karcie tej samej aplikacji | Ograniczenie aktywnej zawartości przez CSP w starych wydrukach i odłączenie `opener`; nowe wydruki floty kodują wszystkie wstawiane teksty |

**Granice tych poprawek:** nie odtworzono PPE, które mogło zostać usunięte wcześniej. Do odzyskania potrzebna jest kopia bazy lub zachowany eksport. Nie przebudowano na transakcje całego starego przepływu sprzęt + historia. Ostrzeżenie o nieudanym zapisie historii jest naprawą informacji dla użytkownika, nie automatycznym rollbackiem posiadacza sprzętu.

Starsze rekordy już zapisane z błędnym `kind: service` wymagają ręcznej kontroli. Dla kilku niezależnych kontroli nie używaj identycznego, ogólnego typu „Inny” — grupa aktualnego przeglądu jest wyznaczana według typu. „Nie wymaga przeglądu” w tej wersji nie usuwa historycznych rzeczywistych wymagań; decyzję o ich zmianie trzeba uporządkować w danych.

## 3. Najważniejszy temat nadal do zrobienia: uprawnienia starej części

Stary PIN jest porównywany w JavaScript w przeglądarce. Role pochodzą z `settings.roles`, a nazwa użytkownika z lokalnej pamięci. Ukrycie przycisku edycji nie jest weryfikacją uprawnień przez serwer. W źródle znajdują się także demonstracyjne PIN-y i domyślne role.

Nie można z samego ZIP-a stwierdzić, kto realnie ma dostęp do tabel w Twojej bazie. Należy sprawdzić polityki RLS i uprawnienia `anon`/`authenticated`, zamiast zakładać, że chroni je formularz PIN. Widoki „publiczny QR” pobierają dane wspólnym przepływem starej aplikacji, a ograniczenie pól na ekranie nie dowodzi ograniczenia odpowiedzi z bazy.

Następny etap powinien objąć wspólne konta użytkowników, role weryfikowane serwerowo, wydzielone publiczne API zawierające wyłącznie dopuszczone pola HSE oraz ograniczone operacje pracownika. **Nowy moduł floty nie używa starego PIN-u jako uprawnienia do faktur.**

## 4. Pozostałe ryzyka i priorytety rozwoju

### Przekazania narzędzi

Ticket QR jest oparty na danych zakodowanych w Base64, a nie na podpisanej, wygasającej autoryzacji serwerowej. Wymaga osobnej przebudowy: identyfikator w bazie, ważność, jednorazowe użycie i atomowa zmiana posiadacza wraz z historią. Tego nie zmieniano podczas dodawania floty. W Pojazdach przekazanie wykonuje administrator, a silnik sprawdza wersję karty; nie ma jeszcze dwustronnego podpisu kierowców.

### Zdjęcia i dokumenty narzędzi/BHP

W starej części pliki są osadzane jako Base64 w JSON i częściowo trafiają do localStorage. To powiększa rekordy i odczyty, a kompresja historycznych zdjęć może trwale obniżyć ich jakość. Nie uruchamiano funkcji „odchudź zdjęcia w bazie”. Potrzebna jest planowana migracja oryginałów do Storage, miniatury, kontrola dostępu i kopie plików. Nowa flota od początku zapisuje dokumenty oddzielnie w prywatnym Storage.

### Historia i duże listy

Stara historia ma limity 80/250/500 zależnie od miejsca/urządzenia, bez gwarancji pełnego uporządkowania przed limitem; tekstowe polskie daty są niewłaściwym kluczem sortowania. Stara lista sprzętu też nie została przebudowana na paginację. Dodano ISO `createdAt` dla nowych wpisów, ale nie przeniesiono ani nie przeliczono całej starej historii. Potrzebne są serwerowe daty, stronicowanie, wyszukiwanie i eksport całej historii niezależny od listy na ekranie.

Nowa flota odczytuje historię oddzielnie dla pojazdu i pobiera kolejne strony bazy, ale odpowiedź API nadal zawiera całą historię danego pojazdu. Przy dużej skali także tu potrzebna jest paginacja API i asynchroniczny eksport, zamiast dalszego zwiększania limitów.

### Plik główny i kontrola typów

Oryginalny `app/page.tsx` ma ponad 4000 linii i `// @ts-nocheck`. Nowe pliki floty nie mają tego wyłączenia. Stary ekran należy stopniowo rozdzielać na modele, dostęp do danych, uprawnienia, komponenty i tłumaczenia. Jednorazowe pełne przepisanie podczas dodawania Pojazdów podniosłoby ryzyko regresji — nie zostało wykonane.

### Dokumenty, pliki i prywatność

Nowe faktury i dokumenty są dostępne dla administratora; pracownik widzi zdjęcia oraz dane operacyjne floty. Nagłówki zdarzeń, nazwy użytkowników i opisy usterek są operacyjne — nie wpisuj tam danych, które mają zostać wyłącznie w dziale finansowym. Role bardziej szczegółowe, np. osobno warsztat, kadry i księgowość, nie są zaimplementowane.

Kontrola sygnatury pliku nie jest antywirusem. Nie ma automatycznej polityki retencji, skanowania złośliwych plików ani pełnego panelu usuwania zapisanych faktur. CSP w starych wydrukach jest dodatkową ochroną, nie pełną przebudową wszystkich szablonów i typów załączników. Przed wdrożeniem trzeba również sprawdzić istniejące polityki całej aplikacji pod kątem XSS i dostępu publicznego.

## 5. Nowa flota: zaimplementowane mechanizmy

Karta pojazdu obejmuje identyfikację, firmę, rejestrację/VIN/numer flotowy, technikę, przebieg lub motogodziny, lokalizację ręczną i użytkownika. Każdy termin może być oparty na dacie, kilometrach i godzinach; pierwsza osiągnięta granica decyduje o alarmie. Brak wartości nie jest traktowany jak zero ani jak poprawny termin.

Historia obejmuje odczyty, korekty, naprawy, badania, ubezpieczenia, tankowania, załączniki, przekazania i usterki. Są koszty brutto i oryginały faktur. Waluty pozostają rozdzielone. Zapisy mają identyfikator operacji, wersję pojazdu i autora ustalanego na podstawie zweryfikowanego konta. Funkcja SQL łączy zmianę karty, zdarzenie, unieważnienie wpisu i powiązanie plików w transakcji.

Negatywne badanie tworzy zgłoszenie krytyczne i wyłącza pojazd. Naprawa lub pozytywne późniejsze badanie nie zamykają automatycznie wszystkich wcześniejszych usterek i nie przywracają statusu — pozostaje jawna decyzja administratora.

Brak automatycznych serwisowych SMS/e-mail, OCR, GPS, rezerwacji pojazdów, rozliczeń paliwowych na podstawie pełnych tankowań, amortyzacji, płatności i integracji księgowej. Nowy interfejs jest po polsku. To ograniczenia tej wersji, nie funkcje „działające w tle”.

## 6. Proponowany kolejny etap

W pierwszej kolejności: jednolite logowanie i uprawnienia całego programu, bezpieczne przekazania QR, uporządkowanie starej historii i przeniesienie załączników z JSON do Storage. Następnie: powiadomienia zbiorcze o zbliżających się terminach i brakach odczytów, panel kierownika z osobami odpowiedzialnymi oraz terminy planowanych wizyt warsztatowych. Dopiero później GPS, OCR i automatyczne połączenie z księgowością.

Każdy z tych etapów wymaga migracji, testów na kopii i decyzji o rolach, publicznym zakresie QR oraz dostępie do dokumentów.

## 7. Zakres weryfikacji

Wykonano analizę źródeł, 105 automatycznych testów czystej logiki i sprawdzenie składni 21 plików TS/TSX. Nie wykonano pełnego buildu Next.js, kontroli typów z prawdziwymi zależnościami, testów Zod, uruchomienia SQL ani testów połączenia z Vercel/Supabase. Nie przedstawiono zrzutu działającej aplikacji ani nie zmieniono kont użytkownika. Wyniki i instrukcja odbioru są w oddzielnych dokumentach.

## Dokumentacja techniczna wykorzystana przy projekcie

Oficjalne materiały, sprawdzone 17.09.2026:

- Supabase: Storage Buckets — prywatne buckety i podpisane adresy: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Supabase: Row Level Security — kontrola dostępu i klucze serwerowe: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase: getUser — weryfikacja tożsamości: https://supabase.com/docs/reference/javascript/auth-getuser
- Vercel: Functions Limits — ograniczenia przesyłania danych przez funkcje: https://vercel.com/docs/functions/limitations
- Next.js: Server and Client Components — rozdzielenie kodu i danych serwerowych/przeglądarkowych: https://nextjs.org/docs/app/getting-started/server-and-client-components

Dokumentacja uzasadnia wybrane mechanizmy; nie stanowi dowodu poprawnego wdrożenia konkretnej bazy użytkownika.
