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
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_API_PREFIX=/api/backend
SERVER_API_BASE_URL=http://dukcapil-pbd-be:8080
SERVER_API_PREFIX=/api/v1
CORS_ALLOWED_ORIGIN=*
AUTH_COOKIE_SECURE=false
JWT_SECRET=dev-secret-change-me
```

Frontend memakai route proxy Next.js `/api/backend` untuk meneruskan request ke backend Go. Dashboard API wajib login dan token disimpan sebagai cookie HTTP-only.

User seed backend:

- `superadmin` / `superadmin123`
- `admin_dukcapil` / `dukcapil123`
- `admin_pmk` / `pmk123`
- `admin_sekretariat` / `sekretariat123`
