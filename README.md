# Portal for Academia–Industry Collaboration (PFAC)

PFAC is a production-ready, full-stack web platform designed to bridge the gap between academic institutions, student candidates, corporate enterprise partners, and platform administrators. It facilitates skill mapping, internship applications, job placement tracking, department provisioning, and ATS-compliant resume generation.

---

## 🔑 Super Admin Credentials

Use the following default Super Admin credentials to log into the platform and manage all platform data:

- **Role**: Super Admin (`SUPER_ADMIN`)
- **Username / Email**: `admin@mail.com`
- **Password**: `Admin@123`
- **Login Route**: `/login` (automatically redirects to `/dashboard/admin`)

> **Note**: The Super Admin account is auto-seeded in the PostgreSQL database on server startup if not already present.

---

## 👥 Mandatory Role & Entity Association Matrix

Every user in the system is mapped to its relevant institutional or corporate entity:

| Role | Associated Entity | Capabilities |
| :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Platform-Wide | Full administrative control, user provisioning/deletion, college/company management, audit logs. |
| **`COLLEGE_ADMIN`** | `College` | Institutional management, department creation, provisioning Department Admins, Coordinators, and Students. |
| **`DEPARTMENT_ADMIN`** | `College` + `Department` | Department-level read-only oversight, student enrollment monitoring, branch reports. |
| **`FACULTY_COORDINATOR`** | `College` + `Department` | Mentorship feedback, application management, student academic reviews. |
| **`COMPANY_ADMIN`** | `Company` | Corporate profile management, opportunity publishing, recruiter provisioning. |
| **`COMPANY_RECRUITER`** | `Company` | Posting internships & jobs, candidate shortlist, interview scheduling. |
| **`STUDENT`** | `College` + `Department` | Profile editing, internship/job applications, ATS resume generator, skill match. |

---

## 🚀 Deployment & Production Setup

The project is structured for single-command production deployment on platforms such as **Render**, **Railway**, **Vercel**, **Heroku**, or **AWS EC2**.

### Environment Variables (.env)

Ensure the following environment variables are set in your production environment:

```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://neondb_owner:...@ep-...aws.neon.tech/neondb?sslmode=require"
JWT_SECRET=super_secret_jwt_key_pfac_portal_2026_dev_secure
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=super_refresh_jwt_key_pfac_portal_2026_dev_secure
REFRESH_TOKEN_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=...
SMTP_PASS=...
```

### Production Build & Launch

```bash
# 1. Install dependencies
npm run install:all

# 2. Generate Prisma Client & Build React Frontend
npm run build

# 3. Start Production Server
npm start
```

*The Express backend handles API requests under `/api/*` and automatically serves the compiled React single-page application for client routes.*

---

## 🏃 Local Development

To run backend and frontend concurrently in development mode:

```bash
npm run dev
```

- **Backend**: Runs on `http://localhost:5000`
- **Frontend**: Runs on `http://localhost:3000` (proxied to port 5000)

## Student training workflow

Students can browse and filter the training catalog at `/student/training`, enroll once in a program, and record a passing assessment result. A completion is saved with the enrollment, score, and certificate code; covered skills and the certification record are added to the student's profile. Enrollment is tied to the signed-in student account and survives server restarts.

The current skill, recruitment, and training workflows use the Prisma schema additions for persistent opportunities, application stages, company approval, training programs, and enrollments. After updating the project, apply the additive schema change to the configured database before starting the API:

```bash
npm run prisma:db-push
npm run build
npm start
```

For local development, run the database push once before `npm run dev`. The curated training catalog is bundled with the application; provider-published programs and student enrollments are stored in the database. Assessment scores are entered as results from the program's external assessment; this version does not host or proctor those assessments. Package statistics, SMS/WhatsApp, hosted assessments, and AI resume/JD parsing remain outside this release.
