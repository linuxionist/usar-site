# Ridgeline Task Force — USAR Website

A full-stack starting scaffold for an Urban Search & Rescue team website,
built from the site map you provided. "Ridgeline Task Force" is a
placeholder name — rename it in `frontend/src/components/Header.jsx`,
`Footer.jsx`, and `index.html`.

- **Frontend:** React 19 + Vite, React Router, Axios
- **Backend:** Django 5.1 + Django REST Framework, REST API only (no
  server-rendered templates)
- **Database:** MySQL

## Project layout

```
usar-site/
├── backend/            Django project (REST API)
│   ├── usar_backend/   settings, root URLs
│   └── operations/     models, serializers, views, admin, seed command
└── frontend/           React SPA (Vite)
    └── src/
        ├── pages/       one component per site-map section
        ├── components/  Header, Footer, shared UI
        ├── api/         Axios client + endpoint map
        └── styles/      design tokens + global stylesheet
```

## Backend setup

1. Create a MySQL database and user:
   ```sql
   CREATE DATABASE usar_db CHARACTER SET utf8mb4;
   CREATE USER 'usar_user'@'%' IDENTIFIED BY 'change-me';
   GRANT ALL PRIVILEGES ON usar_db.* TO 'usar_user'@'%';
   ```
2. ```bash
   cd backend
   python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env        # then edit .env with your DB credentials
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py seed_demo_data   # optional: populate sample content
   python manage.py runserver
   ```
   The API is now live at `http://127.0.0.1:8000/api/v1/`, and content is
   editable at `http://127.0.0.1:8000/admin/`.

   > `mysqlclient` needs MySQL's client dev headers installed on your
   > machine first (e.g. `libmysqlclient-dev` on Debian/Ubuntu,
   > `mysql-client` via Homebrew on macOS).

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env    # points the SPA at the API above
npm run dev
```

The site runs at `http://localhost:5173` and calls the Django API directly
— there's no server-side rendering or proxy involved.

## Admin module

The site now includes the first feature of an internal admin module:
**member management**, at `/admin` in the React app.

- **Backend:** a `Member` model (name, contact info, role/track, status,
  joined date, certifications, internal notes) with a full CRUD REST
  endpoint at `/api/v1/members/`, locked to staff accounts only
  (`IsAdminUser`). Auth is token-based via `rest_framework.authtoken`:
  `POST /api/v1/auth/login/` exchanges a username/password for a token,
  and `GET /api/v1/auth/me/` returns the signed-in user. Only accounts
  with `is_staff=True` can use the admin module — create one with
  `python manage.py createsuperuser`, or flag an existing user as staff
  from `/admin/`.
- **Frontend:** `/admin/login` signs in and stores the token; `/admin/members`
  lists the roster with search and status filtering; `/admin/members/new`
  and `/admin/members/:id` add or edit a member. The admin area has its
  own sidebar layout, separate from the public marketing pages, and
  every admin route is wrapped in `ProtectedRoute` (redirects to login if
  you're signed out).

To try it: run both servers, create a staff user on the backend, then
visit `http://localhost:5173/admin/login`.

This is the pattern to extend for future admin features (deployments,
news, volunteer application review, etc.) — add a model + ModelViewSet
on the backend, and a list/form page pair under `src/admin/pages/` on
the frontend, reusing `AdminLayout` and `adminEndpoints`.

## What's wired up vs. what's a starting point

Every page (`Home`, `Capabilities`, `Deployments`, `Join`, `About`,
`Donate`, `Contact`) fetches real data from the Django API and the two
public forms (volunteer application, contact message) post to it. What
you'll likely still want to add before going live:

- Authentication/rate-limiting on the public POST endpoints
- Image uploads wired into the admin for leadership photos, partner
  logos, and funding-need photos (fields exist on the models already)
- A payment processor integration on the Donate page
- Production settings (`DEBUG=False`, real `SECRET_KEY`, HTTPS, a
  proper `ALLOWED_HOSTS`, and serving static/media via something like
  WhiteNoise or S3)
