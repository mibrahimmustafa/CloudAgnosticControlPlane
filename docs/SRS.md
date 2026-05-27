# Software Requirements Specification (SRS)
## Project: Cloud Agnostic Control Plane (CACP)
**Version:** 1.0
**Status:** Final MVP Baseline

---

## 1. Introduction
### 1.1 Purpose
The Cloud Agnostic Control Plane (CACP) is designed to solve the "Data Silo" problem where business data is fragmented across various SaaS platforms, messaging apps, and databases. The goal is to provide a unified intelligence layer that aggregates this data into a single searchable dashboard.

### 1.2 Scope
The system will provide a middleware API that connects to multiple external services (starting with Telegram), stores user-specific API credentials securely, and offers a unified search interface.

---

## 2. General Description
### 2.1 User Classes and Characteristics
- **Administrator:** Manages the system infrastructure.
- **End User (Business Owner):** Connects their SaaS tools and searches for fragmented customer/business data.

### 2.2 Design Constraints
- **Cloud Agnostic:** Must not depend on a specific cloud provider's proprietary tools.
- **Containerized:** Entire stack must run via Docker Compose for portability.
- **Scalable:** Use of an Abstract Base Class for connectors to allow rapid addition of new integrations.

---

## 3. Functional Requirements
### 3.1 User Management
- **FR1:** The system shall allow users to create accounts and manage their profiles.
- **FR2:** The system shall securely store API keys for various third-party services.

### 3.2 Connector Engine
- **FR3:** The system shall implement a base connector class to standardize data fetching and pushing.
- **FR4:** The system shall support a Telegram Connector to fetch messages and user data.
- **FR5:** The system shall allow the addition of new connectors (e.g., Google Sheets) without modifying the core search logic.

### 3.3 Unified Search
- **FR6:** The system shall provide a global search endpoint that queries all active connectors in parallel.
- **FR7:** The system shall return results in a standardized format (Source, Content, Timestamp).
- **FR8:** Every search query must be logged for audit and analytics.

---

## 4. Non-Functional Requirements
### 4.1 Performance
- **NFR1:** Search results from multiple sources should be aggregated with minimal latency.
- **NFR2:** API responses should be cached using Redis where applicable.

### 4.2 Availability & Reliability
- **NFR3:** The system shall use a health-check mechanism for DB and Redis dependencies.
- **NFR4:** Database persistence must be ensured via named Docker volumes.

### 4.3 Networking
- **NFR5:** All internal communication must happen over a dedicated bridge network (`cacp_internal_net`).
- **NFR6:** External access is restricted to specific ports: 8014 (API), 8010 (Web), 8011 (DB), 8012 (Redis).

---

## 5. Technical Stack
- **Frontend:** Next.js 14, Tailwind CSS, Lucide React.
- **Backend:** FastAPI (Python 3.11), SQLAlchemy.
- **Database:** PostgreSQL 15.
- **Caching/Queue:** Redis.
- **Infrastructure:** Docker & Docker Compose.
