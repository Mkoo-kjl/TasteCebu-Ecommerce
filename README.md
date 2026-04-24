# TasteCebu — Food Product E-Commerce System

A full-stack food product e-commerce platform built with React, Express, and MySQL.

## Prerequisites

Before running the project, make sure each team member has the following installed:

| Software | Version | Download |
|----------|---------|----------|
| **Node.js** | v18 or higher | [nodejs.org](https://nodejs.org/) |
| **npm** | v9+ (comes with Node.js) | Included with Node.js |
| **MySQL Server** | v8.0+ | [dev.mysql.com/downloads](https://dev.mysql.com/downloads/mysql/) |
| **HeidiSQL** (or any MySQL client) | Latest | [heidisql.com](https://www.heidisql.com/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

## Tech Stack

- **Frontend**: React 19 + Vite 8 + React Router 7
- **Backend**: Express 5 + Node.js
- **Database**: MySQL 8 (mysql2 driver)
- **Auth**: JWT (jsonwebtoken) + BCrypt password hashing
- **HTTP Client**: Axios
- **UI**: Vanilla CSS with dark/light theme support

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd TasteCebu-Ecommerce
```

### 2. Install Dependencies

```bash
# Install root dependencies (concurrently)
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Configure Environment

The server `.env` file is located at `server/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=tastecebu
JWT_SECRET=tastecebu_secret_key_2026_do_not_share
JWT_EXPIRES_IN=7d
```

> **Note**: Update `DB_USER` and `DB_PASS` if your MySQL setup uses different credentials.

### 4. Setup the Database

Make sure your MySQL server is running, then:

```bash
cd server
node seed.js
```

This will:
- Create the `tastecebu` database
- Create all required tables
- Create a default admin account

**Default Admin Account:**
- Email: `admin@tastecebu.com`
- Password: `admin123`

### 5. Run the Application

From the project root:

```bash
npm run dev
```

This starts both servers concurrently:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## Project Structure

```
TasteCebu-Ecommerce/
├── client/                    # React Frontend (Vite)
│   └── src/
│       ├── components/        # Reusable components (Navbar, Footer, Modal, etc.)
│       ├── contexts/          # Auth & Theme context providers
│       ├── pages/             # All page components
│       ├── utils/             # API utility (Axios instance)
│       ├── App.jsx            # Main app with routes
│       ├── App.css            # Component styles
│       ├── index.css          # Design system & global styles
│       └── main.jsx           # Entry point
├── server/                    # Express Backend
│   ├── middleware/            # JWT auth middleware
│   ├── routes/                # API route handlers
│   │   ├── auth.js            # Register, Login, Forgot Password
│   │   ├── users.js           # Profile, Password, Settings
│   │   ├── seller.js          # Seller application & product CRUD
│   │   ├── products.js        # Public product listing
│   │   ├── cart.js            # Shopping cart
│   │   ├── orders.js          # Order management
│   │   └── admin.js           # Admin panel APIs
│   ├── db.js                  # MySQL connection pool
│   ├── schema.sql             # Database schema
│   ├── seed.js                # Database setup script
│   ├── server.js              # Express app entry point
│   └── .env                   # Environment config
└── package.json               # Root scripts
```

## Features

### User Roles
- **User**: Browse products, add to cart, place orders, manage profile
- **Seller**: All user features + product CRUD (create, read, update, delete)
- **Admin**: Approve/reject seller applications, manage orders & users

### Authentication
- JWT token-based authentication with BCrypt password hashing
- Security question-based password recovery
- Role-based route protection (frontend & backend)

### Key Pages
| Page | URL | Access |
|------|-----|--------|
| Landing | `/` | Public |
| Login | `/login` | Public |
| Register | `/register` | Public |
| Forgot Password | `/forgot-password` | Public |
| Products | `/products` | Public |
| Product Detail | `/products/:id` | Public |
| Cart | `/cart` | Authenticated |
| Orders | `/orders` | Authenticated |
| Profile | `/profile` | Authenticated |
| Settings | `/settings` | Authenticated |
| Seller Apply | `/seller/apply` | Authenticated |
| Seller Dashboard | `/seller/dashboard` | Seller/Admin |
| Admin Dashboard | `/admin` | Admin only |

## API Endpoints

### Auth (`/api/auth`)
- `POST /register` — Create account
- `POST /login` — Sign in
- `POST /forgot-password` — Get security question
- `POST /reset-password` — Reset with security answer
- `GET /me` — Get current user (requires token)

### Users (`/api/users`)
- `GET /profile` — Get profile
- `PUT /profile` — Update profile (name, email, phone, address, avatar)
- `PUT /password` — Change password
- `GET /settings` — Get theme/notifications
- `PUT /settings` — Update settings

### Products (`/api/products`)
- `GET /` — List all products (with search, filter, sort)
- `GET /:id` — Product details

### Seller (`/api/seller`)
- `POST /apply` — Submit seller application
- `GET /application-status` — Check application status
- `GET /products` — List own products
- `POST /products` — Create product
- `PUT /products/:id` — Update product
- `DELETE /products/:id` — Delete product

### Cart (`/api/cart`)
- `GET /` — View cart
- `POST /` — Add to cart
- `PUT /:id` — Update quantity
- `DELETE /:id` — Remove item

### Orders (`/api/orders`)
- `POST /` — Place order
- `GET /` — List orders (with status filter)
- `GET /:id` — Order details
- `PUT /:id/cancel` — Cancel order

### Admin (`/api/admin`)
- `GET /applications` — List seller applications
- `PUT /applications/:id` — Approve/reject
- `GET /users` — List all users
- `GET /orders` — List all orders
- `PUT /orders/:id/status` — Update order status

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED` on database | Make sure MySQL server is running |
| Port already in use | Kill the process using that port or change in `.env` |
| `Cannot find module` | Run `npm install` in both `server/` and `client/` |
| Seed script fails | Ensure MySQL is running and credentials in `.env` are correct |
