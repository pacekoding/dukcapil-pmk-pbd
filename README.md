# DUKCAPIL-PBD

Monorepo untuk aplikasi DUKCAPIL Papua Barat Daya.

## Struktur

```txt
DUKCAPIL-PBD/
├── apps/
│   ├── dukcapil-pbd-fe/     # Next.js
│   └── dukcapil-pbd-be/     # Golang API
├── docker-compose.yml
├── .env
└── README.md
```

Backend Go memakai struktur `cmd/api` sebagai entrypoint dan `internal/` untuk `controller`, `middleware`, `model`, `repository`, dan `router`. Data admin dan data wilayah tersimpan di Postgres melalui migrasi SQL dan repository GORM.

## Development with Docker

Docker Compose menyediakan PostgreSQL, backend Go, dan frontend Next.js. Go,
Node.js, dan PostgreSQL tidak perlu dipasang di host. Database dan file upload
disimpan dalam named volume Docker yang portable; tidak ada path host khusus
macOS, Windows, atau Linux.

### macOS dan Linux

Prasyarat: Git, Docker Desktop (macOS) atau Docker Engine dengan Compose V2
(Linux).

```bash
git clone <repository>
cd dukcapil-pmk-pbd
cp .env.example .env
docker compose up -d --build
```

### Windows 11 + WSL2

Gunakan Docker Desktop dengan WSL2 backend dan Linux containers. Jalankan Git
serta Compose dari distro WSL2. Clone di filesystem WSL (bukan drive Windows)
untuk performa dan permission file yang lebih konsisten:

```bash
cd ~
mkdir -p projects
cd projects
git clone <repository>
cd dukcapil-pmk-pbd
cp .env.example .env
docker compose up -d --build
```

Command operasional:

```bash
docker compose ps
docker compose logs -f
docker compose down
docker compose down -v
```

`docker compose down -v` menghapus database dan file upload development lokal.
Jangan jalankan command tersebut pada environment yang datanya perlu disimpan.

Frontend berjalan di `http://localhost:3000`.
Backend health check berjalan di `http://localhost:8080/health`.
Postgres berjalan di `localhost:5432`.

Untuk akses dari perangkat lain di jaringan lokal, buka `http://<IP-komputer-host>:3000`. Compose melakukan bind frontend dan backend ke `0.0.0.0` secara default; override dengan `FE_HOST` atau `BE_HOST` jika perlu membatasi interface.

## Menjalankan Frontend Saja

```bash
cd apps/dukcapil-pbd-fe
npm install
npm run dev
```

## Menjalankan Backend Saja

```bash
cd apps/dukcapil-pbd-be
export DATABASE_URL="postgres://dukcapil_pbd:dukcapil_pbd_password@localhost:5432/dukcapil_pbd?sslmode=disable"
go run ./cmd/api
```

## Continuous Integration

Repository ini menggunakan GitHub Actions untuk menjalankan checkout, instalasi, lint, build frontend, dan validasi backend pada setiap push atau pull request ke `main`.

## Konfigurasi Env

Root `.env` dipakai oleh Docker Compose.

```env
FE_PORT=3000
FE_HOST=0.0.0.0
BE_PORT=8080
BE_HOST=0.0.0.0
POSTGRES_DB=dukcapil_pbd
POSTGRES_USER=dukcapil_pbd
POSTGRES_PASSWORD=dukcapil_pbd_password
POSTGRES_PORT=5432
DATABASE_URL=postgres://dukcapil_pbd:dukcapil_pbd_password@dukcapil-pbd-db:5432/dukcapil_pbd?sslmode=disable
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_API_PREFIX=/api/backend
SERVER_API_BASE_URL=http://dukcapil-pbd-be:8080
SERVER_API_PREFIX=/api/v1
CORS_ALLOWED_ORIGIN=*
AUTH_COOKIE_SECURE=false
JWT_SECRET=dev-secret-change-me
STORAGE_ROOT=/app/storage/uploads
MAX_UPLOAD_SIZE_MB=20
```

Frontend memakai route proxy Next.js `/api/backend` untuk meneruskan request ke backend Go. Dashboard API wajib login dan token disimpan sebagai cookie HTTP-only.

`STORAGE_ROOT` adalah path di dalam container backend. Jangan mengisinya dengan
path host. `MAX_UPLOAD_SIZE_MB` diterapkan oleh backend dan diteruskan ke validasi
frontend saat image dibangun.

## Penyimpanan File

File PDF dan image disimpan di named volume Docker, sedangkan PostgreSQL hanya
menyimpan metadata dan storage key relatif. Format yang diterima adalah PDF,
JPEG, PNG, dan WebP. Nama file fisik menggunakan UUID dan penulisan dilakukan
secara atomik tanpa menimpa file yang sudah ada.

Endpoint file baru menggunakan ID metadata:

```txt
GET /api/backend/files/{file_id}/preview
GET /api/backend/files/{file_id}/download
```

Endpoint file memerlukan login dan pemeriksaan hak akses.

## Data Agregat Dukcapil

Portal internal mengelola data tahunan per kabupaten/kota melalui endpoint
Endpoint administrasi kependudukan yang memerlukan login dengan role Dukcapil:

```txt
GET /api/backend/dukcapil/pendaftaran-penduduk
GET /api/backend/dukcapil/pendaftaran-penduduk/{region_id}
PUT /api/backend/dukcapil/pendaftaran-penduduk/{region_id}

GET /api/backend/dukcapil/pencatatan-sipil
GET /api/backend/dukcapil/pencatatan-sipil/{region_id}
PUT /api/backend/dukcapil/pencatatan-sipil/{region_id}
```

Tahun diambil dari sesi login. Data tetap menggunakan tabel lintas tahun
`data_wilayah` dengan primary key `(tahun_anggaran, id)`, sehingga endpoint baru
tidak membuat master wilayah kedua. Kolom tahun disimpan sebagai data, bukan
bagian dari nama tabel.

Panduan arsitektur, migrasi volume lama, backup, dan restore tersedia di
[`docs/02_FILE_UPLOAD_STORAGE_RULES.md`](docs/02_FILE_UPLOAD_STORAGE_RULES.md).

## Backup Wajib

Backup portal harus selalu mencakup dump PostgreSQL dan named volume upload dari
waktu yang sama. Salah satu tanpa yang lain tidak cukup.

Contoh:

```bash
set -a
. ./.env
set +a
mkdir -p backups
docker compose exec -T dukcapil-pbd-db sh -lc \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > backups/dukcapil-pbd.dump
docker run --rm \
  -v dukcapil-pbd_dukcapil-pbd-uploads:/source:ro \
  -v "$PWD/backups":/backup \
  alpine:3.20 tar -C /source -czf /backup/dukcapil-pbd-uploads.tar.gz .
```

Jangan menjalankan `docker compose down -v` pada server yang menyimpan data.
Opsi `-v` menghapus volume PostgreSQL dan upload.

User seed development: `superadmin` / `superadmin789`. Ganti password setelah
login jika environment dapat diakses oleh pihak lain.
