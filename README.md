# Coaching Management System (CCMS)

A modern coaching management system built with Next.js, Neon (PostgreSQL), Drizzle ORM, and NextAuth.js.

## Features

- **Role-Based Access**: Specialized dashboards for Coaches and Coachees.
- **Booking System**: Coachees can browse coaches and request sessions ("tag jadwal").
- **Session Management**: Coaches can accept or reject booking requests ("tembakan jadwal").
- **Modern UI**: Built with Tailwind CSS, ShadCN UI, and Framer Motion for a premium feel.
- **Authentication**: Secure authentication via NextAuth.js (Google Provider by default) integrated with Neon Database.

## Getting Started

1.  **Environment Setup**:
    Copy `.env.example` to `.env` and fill in your credentials:
    ```bash
    cp .env.example .env
    ```
    - `DATABASE_URL`: Your Neon connection string (e.g., `postgresql://...`).
    - `AUTH_SECRET`: Generate with `npx auth secret`.
    - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From Google Cloud Console.

2.  **Database Migration**:
    Push the schema to your Neon database:
    ```bash
    npx drizzle-kit push
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Project Structure

- `src/db`: Database schema and connection logic.
- `src/auth.ts`: Authentication configuration.
- `src/app/dashboard`: Role-based dashboards.
- `src/actions`: Server actions for data mutation (bookings, role updates).
- `src/components/ui`: Reusable UI components.

## Notes

- **Neon Auth**: Users are stored in the `user` table within your Neon database, managed by NextAuth.js adapter.
- **Roles**: New users are redirected to `/onboarding` to select their role (Coach/Coachee).
