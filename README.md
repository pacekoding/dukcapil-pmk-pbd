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

## Menjalankan dengan Docker

Salin `.env.example` menjadi `.env`, lalu pastikan `UPLOADS_HOST_PATH` menunjuk ke
direktori absolut di host. Direktori ini menyimpan file pengguna di luar lifecycle
container.

Mac:

```bash
mkdir -p /Users/Shared/dukcapil-pmk/uploads
```

Linux:

```bash
sudo install -d -m 0770 -o 10001 -g 10001 /srv/dukcapil-pmk/uploads
```

Setelah direktori tersedia:

```bash
docker compose up --build
```

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
UPLOADS_HOST_PATH=/Users/Shared/dukcapil-pmk/uploads
STORAGE_ROOT=/app/storage/uploads
MAX_UPLOAD_SIZE_MB=20
```

Frontend memakai route proxy Next.js `/api/backend` untuk meneruskan request ke backend Go. Dashboard API wajib login dan token disimpan sebagai cookie HTTP-only.

`STORAGE_ROOT` adalah path di dalam container backend. Jangan mengisinya dengan
path host. `MAX_UPLOAD_SIZE_MB` diterapkan oleh backend dan diteruskan ke validasi
frontend saat image dibangun.

## Penyimpanan File

File PDF dan image disimpan di bind mount host, sedangkan PostgreSQL hanya
menyimpan metadata dan storage key relatif. Format yang diterima adalah PDF,
JPEG, PNG, dan WebP. Nama file fisik menggunakan UUID dan penulisan dilakukan
secara atomik tanpa menimpa file yang sudah ada.

Endpoint file baru menggunakan ID metadata:

```txt
GET /api/backend/files/{file_id}/preview
GET /api/backend/files/{file_id}/download
GET /api/backend/website/files/{file_id}/preview
GET /api/backend/website/files/{file_id}/download
```

Endpoint tanpa `/website` memerlukan login dan pemeriksaan scope. Endpoint
website hanya dapat membuka file OPTIMA yang metadata-nya public dan artikel
induknya sedang Published dalam periode tayang.

Panduan arsitektur, migrasi volume lama, backup, dan restore tersedia di
[`docs/02_FILE_UPLOAD_STORAGE_RULES.md`](docs/02_FILE_UPLOAD_STORAGE_RULES.md).

## Backup Wajib

Backup portal harus selalu mencakup dump PostgreSQL dan folder
`UPLOADS_HOST_PATH` dari waktu yang sama. Salah satu tanpa yang lain tidak cukup.

Contoh:

```bash
set -a
. ./.env
set +a
mkdir -p backups
docker compose exec -T dukcapil-pbd-db sh -lc \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > backups/dukcapil-pbd.dump
tar -C "$(dirname "$UPLOADS_HOST_PATH")" \
  -czf backups/dukcapil-pbd-uploads.tar.gz "$(basename "$UPLOADS_HOST_PATH")"
```

Jangan menjalankan `docker compose down -v` pada server yang menyimpan data.
Opsi `-v` menghapus volume PostgreSQL. Bind mount upload tidak menggantikan
kebutuhan backup.

User seed backend:

- `superadmin` / `superadmin123`
- `admin_dukcapil` / `dukcapil123`
- `admin_pmk` / `pmk123`
- `admin_sekretariat` / `sekretariat123`
