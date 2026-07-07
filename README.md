# 📊 Finance Works Monitoring System (FWMS)

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC.svg)](https://tailwindcss.com/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/MySQL-8-blue.svg)](https://www.mysql.com/)

## 1. 📖 Project Overview

**Finance Works Monitoring System (FWMS)** is a comprehensive workflow management web application developed for the Finance Department of the North Western Railway. The primary purpose of this system is to streamline, track, and analyze the lifecycle of finance proposals. It provides full transparency over processing stages, tracks the exact time spent by officers on tasks, identifies bottlenecks, and helps management improve overall departmental efficiency.

## 2. ✨ Features

- **Multi-product Proposals**: Create and manage proposals containing multiple items/products in a single request.
- **Department-based Access Control**: Role and department-based authorization to ensure users only see and action proposals relevant to them.
- **User Management (Admin)**: Full CRUD capabilities for administrators to manage users, roles, and department assignments.
- **Proposal Movement Workflow**: Seamless state-machine driven transitions between stages (Section Officer, Accounts Officer, Sr. Accounts Officer, FA&CAO).
- **Officer Assignment**: Proposals are explicitly assigned to specific Executive or Accounts officers to ensure accountability.
- **Officer Performance Dashboard**: Dedicated views for officers to monitor their pending workload and personal performance metrics.
- **Audit Trail**: Immutable logging of all actions, movements, and assignments.
- **Proposal Comments**: Integrated commenting system for officers to discuss and clarify details.
- **Return Remarks**: Structured capturing of reasons when a proposal is returned/rejected.
- **Notification System**: Real-time alerts when proposals are assigned, moved, returned, or commented on.
- **Dashboard and Reports**: High-level visual analytics featuring KPI cards and Recharts-powered graphs.
- **Stage Delay and Aging Reports**: Detailed analytics to pinpoint where proposals are getting stuck and for how long.
- **Department Performance Reports**: Comparative analysis of proposal processing speeds across various departments.

## 3. 🛠️ Tech Stack

### Backend
- **Java 17**
- **Spring Boot** (REST APIs)
- **Spring Data JPA** (Hibernate ORM)
- **Maven** (Build Tool)
- **MySQL 8** (Relational Database)

### Frontend
- **React (Vite)** (UI Framework)
- **Tailwind CSS** (Styling)
- **Axios** (HTTP Client)
- **Recharts** (Data Visualization)

### Deployment
- **Vercel** (Frontend Hosting)
- **Render** (Backend Hosting)
- **Railway MySQL** (Database Hosting)

## 4. 🏗️ System Architecture

The application follows a standard three-tier architecture:

```
[ React Frontend (Vite) ]
          │
          ▼  (REST API over HTTP/JSON)
          │
[ Spring Boot Backend ]
          │
          ▼  (JDBC / Hibernate)
          │
[ MySQL Database ]
```

## 5. 🔄 Workflow

The proposal lifecycle is strictly managed to ensure proper vetting and accountability:

1. **Executive creates proposal**
   ↓
2. **Assigned to Executive officer** (automatically assigned upon creation)
   ↓
3. **Forward to Accounts officer** (proposal moves to Accounts department)
   ↓
4. **Review** (Accounts officer examines the proposal items and details)
   ↓
5. **Approve / Return** (Accounts officer approves to next stage OR returns it with remarks)
   ↓
6. **If Returned:**
   **Assigned back to Executive officer** (for clarification/revision)
   ↓
7. **Resubmit** (Executive officer addresses remarks and forwards it again)
   ↓
8. **Completed** (Final approval by FA&CAO)

## 6. 🗂️ Project Structure

```
Finance Works Monitoring System/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/nwr/finance/
│       ├── config/         (CORS, DataInitializer, Security configs)
│       ├── controller/     (REST Controllers mapping endpoints)
│       ├── dto/            (Data Transfer Objects for API requests/responses)
│       ├── entity/         (JPA Entities mapping to MySQL tables)
│       ├── exception/      (Global Exception Handler)
│       ├── repository/     (Spring Data JPA repositories)
│       └── service/        (Business logic and transaction management)
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── api/            (Axios configuration and API service classes)
        ├── components/     (Reusable UI components: layout, sidebar, tables)
        ├── context/        (React Context for global state like Auth)
        └── pages/          (Main views: Dashboard, Proposals, Reports, etc.)
```

## 7. 🚀 Installation

### Prerequisites
- Java 17+
- Node.js 18+
- Maven 3.8+
- MySQL 8.0+

### Backend Setup
1. Create a MySQL database locally (e.g., `finance_works_db`).
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
*Note: The application includes a `DataInitializer` that automatically seeds the database with test users, departments, stages, and dummy proposals on the first run.*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## 8. 🔐 Environment Variables

For production deployments, the following environment variables must be configured:

### Backend (Render)
- `DB_URL`: JDBC Connection string (e.g., `jdbc:mysql://host:port/db_name`)
- `DB_USERNAME`: Database user
- `DB_PASSWORD`: Database password
- `DDL_AUTO`: Database initialization strategy (e.g., `update`, `none`)
- `SPRING_PROFILES_ACTIVE`: Use `prod` for production to override local profiles

### Frontend (Vercel)
- `VITE_API_URL`: The production URL of the Spring Boot backend (e.g., `https://my-backend.onrender.com`)

## 9. 📸 Screenshots

*(Replace the placeholders below with actual application screenshots)*

### Dashboard
![Dashboard Placeholder](https://via.placeholder.com/800x400?text=Dashboard+Screenshot)

### Proposal List
![Proposal List Placeholder](https://via.placeholder.com/800x400?text=Proposal+List+Screenshot)

### Proposal Details
![Proposal Details Placeholder](https://via.placeholder.com/800x400?text=Proposal+Details+Screenshot)

### Reports
![Reports Placeholder](https://via.placeholder.com/800x400?text=Reports+Screenshot)

### Officer Performance
![Officer Performance Placeholder](https://via.placeholder.com/800x400?text=Officer+Performance+Screenshot)

### Notifications
![Notifications Placeholder](https://via.placeholder.com/800x400?text=Notifications+Screenshot)

### User Management
![User Management Placeholder](https://via.placeholder.com/800x400?text=User+Management+Screenshot)

## 10. 🔮 Future Scope

Possible future improvements and enhancements include:
- **Email/SMS Notifications**: Integrating third-party services to send critical alerts via Email or SMS.
- **File Attachments**: Allowing officers to attach PDFs, Excel sheets, and images directly to proposals.
- **Configurable Workflows**: Building an admin UI to dynamically create and modify department routing stages without code changes.
- **JWT Authentication**: Implementing robust token-based security for API protection.
- **Analytics Enhancements**: Adding predictive analytics and more granular filters for custom report generation.

## 11. 👥 Contributors

- **Sanjam** - *Lead Developer* - [GitHub](https://github.com/sanjam4747)

## 12. 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
