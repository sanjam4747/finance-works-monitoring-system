-- Finance Works Monitoring System
-- MySQL Schema Script
-- Run this ONLY if you want to manually create the database schema.
-- The Spring Boot app will create tables automatically via JPA (ddl-auto=update).

CREATE DATABASE IF NOT EXISTS finance_works_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE finance_works_db;

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Proposal Stages
CREATE TABLE IF NOT EXISTS proposal_stages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stage_name VARCHAR(100) NOT NULL UNIQUE,
    sequence_number INT NOT NULL
);

-- Proposals
CREATE TABLE IF NOT EXISTS proposals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    proposal_number VARCHAR(50) NOT NULL UNIQUE,
    proposal_title VARCHAR(255) NOT NULL,
    department_id BIGINT NOT NULL,
    current_stage_id BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    submission_date DATE NOT NULL,
    completion_date DATE,
    remarks VARCHAR(1000),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (current_stage_id) REFERENCES proposal_stages(id)
);

-- Proposal Movements (Audit Trail)
CREATE TABLE IF NOT EXISTS proposal_movements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    proposal_id BIGINT NOT NULL,
    from_stage_id BIGINT,
    to_stage_id BIGINT NOT NULL,
    entered_at DATETIME(6) NOT NULL,
    exited_at DATETIME(6),
    days_spent BIGINT,
    remarks VARCHAR(1000),
    FOREIGN KEY (proposal_id) REFERENCES proposals(id),
    FOREIGN KEY (from_stage_id) REFERENCES proposal_stages(id),
    FOREIGN KEY (to_stage_id) REFERENCES proposal_stages(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_department ON proposals(department_id);
CREATE INDEX IF NOT EXISTS idx_proposals_stage ON proposals(current_stage_id);
CREATE INDEX IF NOT EXISTS idx_movements_proposal ON proposal_movements(proposal_id);
CREATE INDEX IF NOT EXISTS idx_movements_exited ON proposal_movements(exited_at);
