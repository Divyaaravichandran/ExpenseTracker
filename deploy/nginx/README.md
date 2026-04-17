# EC2 Nginx proxy setup (port 80/443)

This repo’s frontend can run entirely on port **80/443** if Nginx (or an ALB) proxies API paths to the backend on **127.0.0.1:4000**.

## 1) Backend

- Ensure your backend listens on `4000` (or set `API_PORT=4000` in `backend/.env`).
- Run it with `pm2` (example):
  - `pm2 start backend/dist/main.js --name expense-api`

## 2) Frontend

- Build:
  - `npm --prefix frontend run build`
- Copy `frontend/dist/` to:
  - `/var/www/expense-management/`

Important: the frontend defaults to same-origin API in production (`frontend/src/api/axios.ts`), so requests go to `/auth/*`, `/api/*`, `/v1/*` on port 80/443.

## 3) Nginx

- Copy `deploy/nginx/expense-management.conf` to:
  - `/etc/nginx/sites-available/expense-management`
- Enable it:
  - `ln -s /etc/nginx/sites-available/expense-management /etc/nginx/sites-enabled/expense-management`
- Test + reload:
  - `nginx -t && systemctl reload nginx`

## 4) Security group

- Allow inbound `80` (and `443` if using TLS).
- Keep `4000` **closed** to the internet (only local Nginx should reach it).
