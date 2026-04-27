# Smart Evaluation — Bug Fixes & Setup Guide

## What Was Fixed

### 1. MongoDB Not Receiving Data
- **Root cause:** No `.env` file existed — only `.env.example`. So `MONGODB_URI` was never loaded.
- **Fix:** A `.env` file is now included. Copy it to your project root.

### 2. Evaluation Analytics Route Conflict (`CastError`)
- **Root cause:** `/analytics/summary` was registered AFTER `/:id`. Express matched
  the word "analytics" as a MongoDB ObjectId → threw `CastError: analytics is not a valid ObjectId`.
- **Fix:** `/analytics/summary` is now registered BEFORE `/:id` in `evaluations.routes.ts`.

### 3. Stale Token in Frontend
- **Root cause:** `const token = localStorage.getItem("token")` was read once at page load.
  After login, the new token wasn't picked up until a full page reload.
- **Fix:** Token is now read fresh inside `getToken()` on every API call.

### 4. Duplicate Student Emails Not Caught
- **Root cause:** `email` field in Student schema had no `unique: true` constraint.
  Duplicate emails silently caused confusing errors.
- **Fix:** `email` is now `unique: true` with proper 409 error responses.

### 5. Build Script Referenced Missing `tsconfig.client.json`
- **Root cause:** `"build": "tsc -p tsconfig.server.json && tsc -p tsconfig.client.json"` — the client
  tsconfig never existed, so `npm run build` always failed.
- **Fix:** Build script now only compiles the server. The frontend JS is pre-compiled vanilla JS.

### 6. No Logout Button
- **Root cause:** No way to clear the JWT token and return to login.
- **Fix:** Logout button added to `dashboard.html`. All pages call `initLogout()`.

### 7. No Global Error Handler
- **Root cause:** Unhandled promise rejections crashed the server silently.
- **Fix:** Global Express error handler added in `server.ts` + `process.on('unhandledRejection')`.

### 8. Evaluation Form Could Submit With No Rubric
- **Root cause:** If an assignment had no rubric rows, an empty `marks: []` array was submitted,
  causing a silent save with no useful data.
- **Fix:** Frontend now validates rubric rows before submission, and the backend checks `marks` length.

---

## Project Folder Structure

```
smart-eval/
├── .env                        ← ADD THIS (copy from .env.example)
├── package.json
├── tsconfig.server.json
└── src/
    ├── server.ts
    ├── middleware/
    │   └── auth.ts
    ├── models/
    │   ├── User.ts
    │   ├── Student.ts
    │   ├── Assignment.ts
    │   └── Evaluation.ts
    ├── routes/
    │   ├── auth.routes.ts
    │   ├── students.routes.ts
    │   ├── assignments.routes.ts
    │   ├── evaluations.routes.ts
    │   └── reports.routes.ts
    ├── utils/
    │   └── grading.ts
    ├── scripts/
    │   └── clear-db.ts         ← NEW: clears all DB collections
    └── public/
        ├── index.html
        ├── register.html
        ├── dashboard.html      ← UPDATED: logout button added
        ├── students.html
        ├── assignments.html
        ├── evaluation.html
        ├── analytics.html
        ├── reports.html
        ├── styles.css
        └── js/
            └── app.js          ← FIXED: token, logout, error handling
```

---

## Setup Instructions

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Set up .env
```bash
cp .env.example .env
```
Edit `.env` if needed:
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smart-eval
JWT_SECRET=smart_eval_super_secret_2024
```

### Step 3 — Start MongoDB
Make sure MongoDB is running on your machine:
```bash
# On Linux/Mac
mongod --dbpath /data/db

# Or if installed as a service
sudo systemctl start mongod
```

### Step 4 — Clear old/corrupt database data (run once)
```bash
npm run clear-db
```

### Step 5 — Start the server
```bash
npm run dev
```

Open: **http://localhost:5000**

---

## Verify MongoDB Is Working

After starting the server, visit:
```
http://localhost:5000/api/health
```
You should see:
```json
{ "status": "ok", "db": "connected" }
```

If `db` shows `"disconnected"`, MongoDB is not running.

---

## Using MongoDB Atlas (Cloud) Instead of Local

If you don't want to run MongoDB locally, use MongoDB Atlas (free):

1. Go to https://mongodb.com/atlas and create a free cluster
2. Get your connection string, e.g.:
   `mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/smart-eval`
3. Put it in your `.env`:
   ```
   MONGODB_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/smart-eval
   ```
4. Restart the server — data will now be stored in the cloud.
