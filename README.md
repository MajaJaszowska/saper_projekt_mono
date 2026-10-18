# saper

Moja wersja sapera w przeglądarce, projekt do nauki Reacta i Next.js. Działa bez serwera, wszystko zapisuje sie w przeglądarce (localStorage)

## Co jest

- 3 poziomy + własna plansza
- flagi, znaki zapytania (trzeba włączyć w ustawieniach), klik na liczbę odkrywa sąsiadów
- pierwszy klik zawsze bezpieczny
- kod planszy, który można wysłać komuś innemu i plansza dnia
- statystyki z wykresami, rekordy i odznaki
- motywy, kolory i ikony w Ustawieniach
- eksport / import wyników do pliku

**Uruchomienie**

```
npm install
npm run dev
```

i potem http://localhost:3000

Przez dockera też działa (u mnie na porcie 8080):

```
npm run docker:up
```

### testy
`npm test` - na razie jest tylko jeden plik, reszte musze dopisać

## Do zrobienia

* podpowiedzi (żeby apka pokazywała bezpieczne pole)
* cofanie ruchu
* więcej testów
* Wersja angielska
