# saper

Moja wersja sapera w przeglądarce, napisana w Next.js, React i TypeScript. Działa bez serwera, wszystkie wyniki i ustawienia zapisują się w przeglądarce (localStorage).

## Co jest

- 3 poziomy trudności + własna plansza (od 5x5 do 30x40)
- flagi, znaki zapytania (trzeba włączyć w ustawieniach), klik na liczbę odkrywa sąsiadów
- pierwszy klik zawsze bezpieczny
- kod planszy, który można wysłać komuś innemu, i plansza dnia (taka sama dla wszystkich)
- statystyki z wykresami, rekordy i 12 odznak
- motywy, kolory i ikony w Ustawieniach, tryb jasny i ciemny
- eksport / import wyników do pliku
- działa też na telefonie (flaga = długie przytrzymanie pola)

## Uruchomienie

Są dwie opcje:

- **Node.js** - jeśli chcesz grzebać w kodzie, gra chodzi na http://localhost:3000
- **Docker** - jeśli chcesz tylko pograć, cały build robi się w kontenerze i Node nie jest potrzebny, gra chodzi na http://localhost:8080

Potrzebne programy:

| Program | Wersja | Uwagi |
|---|---|---|
| Git | dowolna | można też pobrać ZIP z GitHuba (Code -> Download ZIP) |
| Node.js + npm | 24 LTS | starsze wersje mogą nie zadziałać |
| Docker | opcjonalnie | Docker Desktop na Windowsie, Docker Engine na Linuxie |

W projekcie jest `package-lock.json`, dlatego zamiast `npm install` lepiej użyć `npm ci`. Zainstaluje dokładnie te wersje paczek, które są w locku.

### Windows

Najszybciej przez `winget` (jest w Windows 10 i 11). W PowerShellu albo Terminalu Windows:

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
```

Potem trzeba zamknąć i otworzyć terminal jeszcze raz, żeby odświeżył się `PATH`. Sprawdzenie: `node -v` powinno pokazać `v24.x`.

```powershell
cd $HOME\Documents
git clone https://github.com/MajaJaszowska/saper_projekt_mono.git
cd saper_projekt_mono
npm ci
npm run dev
```

i potem http://localhost:3000 (zatrzymanie: `Ctrl+C`)

Jeśli PowerShell wywala błąd *running scripts is disabled on this system* przy `npm`, to wystarczy raz wpisać:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

albo po prostu użyć `cmd` zamiast PowerShella.

**Docker na Windowsie** - Docker Desktop potrzebuje WSL 2. Jeśli go nie było, po instalacji trzeba zrestartować komputer:

```powershell
wsl --install
winget install --id Docker.DockerDesktop -e
```

Po restarcie odpalić Docker Desktop, poczekać aż silnik wystartuje i w folderze projektu:

```powershell
docker compose up --build
```

gra będzie na http://localhost:8080

### Linux (Ubuntu / Debian)

Na innych dystrybucjach zmienia się tylko menedżer pakietów (`dnf`, `pacman`), reszta jest taka sama.

```bash
sudo apt update
sudo apt install -y git curl
```

Node.js z `apt` jest za stary (na Ubuntu 24.04 to wersja 18), więc najlepiej zainstalować go przez `nvm`:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 24
node -v
```

Dalej tak samo jak na Windowsie:

```bash
git clone https://github.com/MajaJaszowska/saper_projekt_mono.git
cd saper_projekt_mono
npm ci
npm run dev
```

i potem http://localhost:3000

**Docker na Linuxie** - żeby nie pisać `sudo` przed każdym poleceniem, trzeba dodać się do grupy `docker`, a potem wylogować i zalogować ponownie:

```bash
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER
# wylogowanie i ponowne zalogowanie
docker compose up --build
```

gra będzie na http://localhost:8080. Bez dodania do grupy wyskakuje *permission denied* na `/var/run/docker.sock`. Pierwszy build trwa kilka minut, następne są szybsze.

## Skrypty

| Polecenie | Co robi |
|---|---|
| `npm run dev` | serwer deweloperski na porcie 3000 |
| `npm run build` | build produkcyjny (statyczne pliki) do katalogu `out/` |
| `npm run lint` | ESLint |
| `npm run typecheck` | sprawdzenie typów TypeScript |
| `npm run format` | formatowanie kodu Prettierem |
| `npm run docker:up` | build obrazu i start kontenera (port 8080) |
| `npm run docker:down` | zatrzymanie kontenera |

## Jak coś nie działa

- **port 3000 zajęty** - Next sam przejdzie na kolejny wolny port i wypisze go w konsoli, można też wymusić: `npm run dev -- -p 4000`
- **port 8080 zajęty** - zmienić pierwszą liczbę w `docker-compose.yml` (`"8080:80"`)
- **dziwne błędy przy `npm ci`** - sprawdzić `node -v`, musi być 24
