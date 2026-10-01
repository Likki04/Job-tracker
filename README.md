# Job Application & Interview Tracker

A full-stack application to track job applications, interviews, resumes, and matched skills. Built with **React + TypeScript (Vite)** on the frontend and **FastAPI + SQLAlchemy** on the backend. Ready for 1-click deployment on **Vercel**.

---

## 🚀 Features

- **Dashboard**: High-level statistics on applications, interview rounds, offers, and rejection rates.
- **Application Tracking**: Manage statuses (`Applied`, `Screening`, `Assessment`, `Interview`, `Offer`, `Rejected`), deadlines, notes, and salary info.
- **Interview Scheduler**: Track upcoming interview rounds and timestamps.
- **Skills Matching**: Automatically extract and compare required skills with your profile.
- **Vercel Cloud Ready**: Out-of-the-box support for Vercel Serverless Python functions and Vite static builds.

---

## 🛠️ Local Development

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
- API Documentation (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
- SQLite database (`jobs.db`) is automatically initialized on startup.

### 2. Frontend (Vite + React)
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
- Open [http://localhost:5173](http://localhost:5173) in your browser.
- Vite automatically proxies `/api` requests to `http://localhost:8000`.

---

## ☁️ Deployment on Vercel

### Unified Full-Stack Deployment
This repository is configured to deploy both frontend and backend together on Vercel with zero extra server configuration:
1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your `job-tracker` repository.
4. Leave all default build settings as configured (`vercel.json` automatically handles building the Vite frontend to `frontend/dist` and routing `/api/*` to the serverless Python backend in `api/index.py`).
5. Click **Deploy**.

> **Note on Database in Production:**
> By default, on Vercel Serverless, SQLite runs against `/tmp/jobs.db`. For persistent data storage across serverless cold starts, you can attach any PostgreSQL database (such as free [Supabase](https://supabase.com) or [Neon](https://neon.tech)) by adding a `DATABASE_URL` environment variable in your Vercel Project Settings.
