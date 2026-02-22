# Node Base Project

A full-stack **role-based admin panel** built with Node.js, Express, MongoDB and EJS templating. The project started as a pure REST API backend, and a server-side rendered frontend was added later — which led to a valuable architectural lesson: **backend and frontend work best when separated into independent services**.

---

## 🏗️ Architecture

```
node-base-project/
└── api/
    ├── bin/           # HTTP server entry point
    ├── config/        # App config, enums, role privilege definitions
    ├── db/
    │   ├── Database.js
    │   └── models/    # Mongoose models
    ├── lib/           # Utilities (auth, logger, auditlogs, export...)
    ├── routes/        # Express route handlers
    ├── views/         # EJS templates (admin panel UI)
    └── public/        # Static assets (CSS, JS)
```

### Tech Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Runtime     | Node.js v22                              |
| Framework   | Express.js v4                            |
| Database    | MongoDB (via Mongoose)                   |
| Auth        | JWT (cookie-based) + Passport.js         |
| Views       | EJS (server-side rendering)              |
| Logging     | Winston + custom AuditLogs (MongoDB)     |
| Rate Limit  | express-rate-limit + rate-limit-mongo    |
| Export      | node-xlsx (Excel export)                 |
| Password    | bcrypt                                   |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB running locally on port `27017`

### Installation

```bash
cd api
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
LOG_LEVEL="debug"
CONNECTION_STRING="mongodb://localhost:27017/node_base_project"
PORT=3000
JWT_KEY="your-strong-random-secret"
UPLOAD_FILE_PATH=/path/to/tmp

SUPER_ADMIN_ROLE_NAME=super-admin
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_NAME=Admin
SUPER_ADMIN_SURNAME=User
SUPER_ADMIN_PASSWORD=YourStrongPassword123
SUPER_ADMIN_PHONE=5555555555
```

> **Important:** Never commit `.env` to version control. The `.gitignore` already excludes it.

### Running

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

The app will be available at `http://localhost:3000` and redirects to the admin panel at `/api/admin`.

---

## 🔐 Authentication

Authentication is **cookie-based JWT**. After login, a `jsonwebtoken` cookie is set with:
- `httpOnly: true` — not accessible via JavaScript
- `secure: true` — HTTPS only (in production)
- `sameSite: strict` — CSRF protection
- `maxAge: 24 hours`

API routes (under `/api/users`, `/api/roles`, etc.) use **Passport.js JWT strategy** to extract and validate the token from the cookie on every request.

### Role & Permission System

Permissions are granular string keys (e.g. `user_view`, `role_add`). Roles are collections of permissions. Users can have multiple roles.

All available permissions are defined in `config/role_privileges.js`.

---

## 📡 API Endpoints

All API routes are prefixed with `/api`.

---

### 👤 Users — `/api/users`

| Method | Path        | Auth | Permission     | Description |
|--------|-------------|------|----------------|-------------|
| POST   | `/register` | ❌   | —              | Create the first super-admin user. Only works when the DB has no users. |
| POST   | `/login`    | ❌   | —              | Authenticate and receive a JWT cookie. Rate-limited to 5 requests per 5 seconds. |
| GET    | `/`         | ✅   | `user_view`    | List all users with their roles. ⚠️ *Unused by admin panel — panel fetches users via server-side render.* |
| POST   | `/add`      | ✅   | `user_add`     | Create a new user and assign roles. |
| PUT    | `/update`   | ✅   | `user_update`  | Update user fields (name, phone, password, roles, active status). |
| DELETE | `/delete`   | ✅   | `user_delete`  | Permanently delete a user and their role assignments. |

---

### 🎭 Roles — `/api/roles`

| Method | Path               | Auth | Permission   | Description |
|--------|--------------------|------|--------------|-------------|
| GET    | `/`                | ✅   | `role_view`  | List all roles with their permissions. ⚠️ *Unused by admin panel.* |
| POST   | `/add`             | ✅   | `role_add`   | Create a new role with selected permissions. |
| PUT    | `/update`          | ✅   | `role_update`| Update role name, active status, or permissions. |
| DELETE | `/delete`          | ✅   | `role_delete`| Delete a role and all its permission records. |
| GET    | `/role_privileges` | ✅   | —            | Returns the full list of available permission keys and groups. Used to populate UI checkboxes. |

---

### 📂 Categories — `/api/categories`

| Method | Path      | Auth | Permission        | Description |
|--------|-----------|------|-------------------|-------------|
| GET    | `/`       | ✅   | `category_view`   | List all categories. ⚠️ *Unused by admin panel.* |
| POST   | `/add`    | ✅   | `category_add`    | Create a new category. Also fires a Server-Sent Event notification. |
| PUT    | `/update` | ✅   | `category_update` | Update category name or active status. |
| DELETE | `/delete` | ✅   | `category_delete` | Permanently delete a category. |
| POST   | `/export` | ✅   | `category_export` | Download all categories as an `.xlsx` Excel file. |

---

### 📋 Audit Logs — `/api/auditlogs`

| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| POST   | `/`  | ✅   | —          | Query audit logs with date range filtering and pagination (`skip`, `limit`, max 500). ⚠️ *Unused by admin panel — panel fetches logs via server-side render.* |

---

### 🔔 Events — `/api/events`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | `/`  | ❌   | Server-Sent Events (SSE) stream. Broadcasts real-time notifications (e.g. when a category is added). |

---

### 🖥️ Admin Panel — `/api/admin`

| Method | Path      | Auth | Description |
|--------|-----------|------|-------------|
| GET    | `/`       | ❌   | Login page. Redirects to `/panel` if already authenticated. |
| GET    | `/panel`  | ✅   | Main admin dashboard. Renders all data server-side based on the user's permissions. |
| GET    | `/logout` | ❌   | Clears the JWT cookie and redirects to login. |

---

## 🗂️ Data Models

### User
| Field          | Type    | Notes              |
|----------------|---------|--------------------|
| `email`        | String  | Required, unique   |
| `password`     | String  | Bcrypt hashed      |
| `is_active`    | Boolean | Default: `true`    |
| `first_name`   | String  |                    |
| `last_name`    | String  |                    |
| `phone_number` | String  |                    |

### Role
| Field        | Type     | Notes              |
|--------------|----------|--------------------|
| `role_name`  | String   | Required, unique   |
| `is_active`  | Boolean  | Default: `true`    |
| `created_by` | ObjectId | Ref: `users`       |

### UserRoles *(join table)*
| Field     | Type     |
|-----------|----------|
| `user_id` | ObjectId |
| `role_id` | ObjectId |

### RolePrivileges *(join table)*
| Field         | Type     |
|---------------|----------|
| `role_id`     | ObjectId |
| `permissions` | String   |
| `created_by`  | ObjectId |

### Category
| Field        | Type     |
|--------------|----------|
| `name`       | String   |
| `is_active`  | Boolean  |
| `created_by` | ObjectId |

### AuditLog
| Field       | Type   | Notes                           |
|-------------|--------|---------------------------------|
| `level`     | String | INFO, ERROR, WARN, DEBUG, etc.  |
| `email`     | String | Who performed the action        |
| `location`  | String | Module name (e.g. "Users")      |
| `proc_type` | String | Action type (e.g. "Add")        |
| `log`       | Mixed  | Payload / details               |

---

## 📝 Lessons Learned

This project started as a **pure REST API backend**. Midway through, an EJS-based admin panel frontend was integrated into the same Express server.

**What this caused:**
- Several REST endpoints (`GET /api/users`, `GET /api/roles`, `GET /api/categories`, `POST /api/auditlogs`) became **unused** because the admin panel fetches data via server-side rendering in the `/api/admin/panel` route instead.
- The `GET /api/events` SSE endpoint exists but isn't consumed by the current frontend.
- The backend became responsible for both serving API JSON and rendering HTML views — mixing two concerns in one server.

**The right approach:**
> Run the **backend API** and **frontend** as two **separate services**. The frontend (e.g. React, Vue, or a static Next.js app) calls the API over HTTP. This keeps the backend stateless, makes both parts independently scalable and testable, and avoids the confusion of unused endpoints.

---

## 📄 License

This project is for educational/learning purposes.
