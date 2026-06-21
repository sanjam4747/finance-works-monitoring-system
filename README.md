# Finance Works Monitoring System

A full-stack web application for the **Finance Department of North Western Railway** to track finance proposals across processing stages, calculate time spent, and identify bottlenecks.

## 🎯 Core Features

- **Proposal Tracking** — Track every proposal through defined stages
- **Time Tracking** — Automatically calculate days spent at each stage
- **Delay Analysis** — Identify which stages cause the most delays
- **Dashboard** — Visual analytics with charts and KPI cards
- **Reports** — Aging report, Stage delay report, Department performance report

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Spring Boot 3.2 (Java 17) |
| Database | MySQL 8 |
| ORM | Spring Data JPA (Hibernate) |
| HTTP Client | Axios |
| Charts | Recharts |

## 📋 Prerequisites

- Java 17+
- Maven 3.8+
- Node.js 18+
- MySQL 8.0+

## 🚀 Quick Start

### 1. Database Setup

Create the MySQL database (the app will auto-create tables):

```sql
CREATE DATABASE finance_works_db;
CREATE USER 'finance_user'@'localhost' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON finance_works_db.* TO 'finance_user'@'localhost';
FLUSH PRIVILEGES;
```

Or update `backend/src/main/resources/application.properties` with your credentials.

### 2. Start Backend

```bash
cd backend
mvn spring-boot:run
```

The backend starts at **http://localhost:8080**

Seed data (5 departments, 4 stages, 50 proposals, 200+ movements) is auto-loaded on first run.

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at **http://localhost:5173**

## 🔐 Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Finance Officer | `finance` | `finance123` |

## 📊 Pages

| Page | URL | Description |
|------|-----|-------------|
| Login | `/login` | Authentication |
| Dashboard | `/dashboard` | KPI cards + charts |
| Proposals | `/proposals` | List with filters |
| Create Proposal | `/proposals/create` | New proposal form |
| Move Proposal | `/proposals/move` | Stage transition |
| Proposal Details | `/proposals/:id` | Timeline view |
| Reports | `/reports` | Analytics reports |

## 🔄 Business Logic

When a proposal moves to another stage:

1. The system closes the current movement record (`exitedAt = now`)
2. Calculates `daysSpent = exitedAt - enteredAt`
3. Creates a new movement record for the new stage
4. Updates `proposal.currentStage`
5. Full audit trail is preserved

### Example Movement

```
FW-0001 — Track Renewal Works Phase-1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Section Officer     01 Jun → 05 Jun  →  4 Days
Accounts Officer    05 Jun → 12 Jun  →  7 Days  
Sr. Accounts Officer  12 Jun → 18 Jun  →  6 Days
FA&CAO              18 Jun → Present  →  Running

Total: 17 days elapsed
```

## 🌐 API Endpoints

```
POST   /api/auth/login
GET    /api/departments
GET    /api/stages
GET    /api/proposals?search=&departmentId=&status=&stageId=
POST   /api/proposals
GET    /api/proposals/{id}
POST   /api/proposals/{id}/move
GET    /api/proposals/{id}/movements
PATCH  /api/proposals/{id}/status
GET    /api/dashboard/stats
GET    /api/reports/aging
GET    /api/reports/stage-delay
GET    /api/reports/department-performance
```

## 🏢 Departments (Seeded)

- Engineering
- Electrical
- Mechanical
- Personnel
- Signal & Telecom

## 📋 Processing Stages (Seeded)

1. Section Officer
2. Accounts Officer
3. Senior Accounts Officer
4. FA&CAO

## 🗂️ Project Structure

```
Finance Works Monitoring System/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/nwr/finance/
│       ├── config/         (CORS, DataInitializer)
│       ├── controller/     (REST Controllers)
│       ├── dto/            (Data Transfer Objects)
│       ├── entity/         (JPA Entities)
│       ├── exception/      (Global Exception Handler)
│       ├── repository/     (Spring Data JPA)
│       └── service/        (Business Logic)
└── frontend/
    └── src/
        ├── api/            (Axios + Services)
        ├── components/     (Layout, Sidebar, Navbar, Badges)
        ├── context/        (AuthContext)
        └── pages/          (Login, Dashboard, etc.)
```

## ⚙️ Configuration

Edit `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/finance_works_db?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=root
```

## 📦 Build for Production

```bash
# Backend JAR
cd backend
mvn clean package -DskipTests

# Frontend
cd frontend
npm run build
```
