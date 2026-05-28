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

## Menjalankan dengan Docker

```bash
docker compose up --build
```

Frontend berjalan di `http://localhost:3000`.
Backend health check berjalan di `http://localhost:8080/health`.

## Menjalankan Frontend Saja

```bash
cd apps/dukcapil-pbd-fe
npm install
npm run dev
```

## Menjalankan Backend Saja

```bash
cd apps/dukcapil-pbd-be
go run ./cmd/api
```

## Continuous Integration

Repository ini menggunakan GitHub Actions untuk menjalankan checkout, instalasi, lint, build frontend, dan validasi backend pada setiap push atau pull request ke `main`.

## Konfigurasi Env

Root `.env` dipakai oleh Docker Compose.

```env
FE_PORT=3000
BE_PORT=8080
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_API_PREFIX=/api/mock
JWT_SECRET=dev-secret-change-me
```

Secara default frontend masih memakai API mock Next.js melalui `/api/mock` agar fitur yang sudah ada tetap berjalan. Saat endpoint Go sudah dibuat lengkap, ubah:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_API_PREFIX=/api/v1
```
