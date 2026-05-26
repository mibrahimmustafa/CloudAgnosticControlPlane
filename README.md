# CloudAgnosticControlPlane

A unified control plane to aggregate fragmented business data from multiple sources (SaaS, Messaging, DBs) into a single actionable intelligence layer.

## 🚀 Project Overview
This project solves the "Data Silo" problem for startups and small business owners by providing a unified API and Dashboard to search and manage data across various platforms.

## 🏗 Architecture
The system is built using a modular "Connector" architecture, making it cloud-agnostic and easily extensible.

- **Frontend:** Next.js (React)
- **Backend:** FastAPI (Python)
- **Queue:** Celery / Redis
- **Database:** PostgreSQL
- **Infrastructure:** Docker Compose

## 🛠 Getting Started

### Prerequisites
- Docker & Docker Compose installed.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/mibrahimmustafa/CloudAgnosticControlPlane.git
   cd CloudAgnosticControlPlane
   ```
2. Setup environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```
3. Start the system:
   ```bash
   docker-compose up --build
   ```
