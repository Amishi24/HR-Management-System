<div align="center">

# 🔁 HR Transfer Management System

**An intelligent, graph-powered HR transfer platform that replaces manual rotation decisions with NLP-scored, policy-enforced, atomic transfer cycles.**

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<!-- BANNER: Replace the line below with an actual screenshot or logo -->
<!-- ![System Banner](./docs/banner.png) -->

</div>

---

## 📖 Overview

Large organizations with a geographically distributed workforce  are required to rotate employees across locations on a regular basis to ensure skill development, prevent stagnation, and comply with service rules. Managing this process manually is error-prone, opaque, and slow.

The **HR Transfer Management System** solves this with a purpose-built platform that combines:

- A **graph-based Cycle Engine** that models inter-employee transfer dependencies as a directed graph and extracts optimal, non-overlapping closed transfer loops for an entire discipline.
- An **NLP matching layer** (`sentence-transformers`) that scores every potential transfer edge based on the semantic similarity between an employee's assignment history and the historical role profile of a target position.
- A **role-stratified workflow** that routes decisions through Employees → Department Heads → Location Heads → a central Transfer Head, with a formal appeal mechanism at each stage.
- **Policy-driven guardrails** enforced at runtime: configurable tenure lock-ins, level-gating rules, and per-department capacity caps that prevent overstaffing.

The result is a system where a Transfer Head can select a discipline, inspect all mathematically optimal transfer cycles ranked by AI match scores, selectively exempt participants, and execute the entire batch atomically — in a single click.

---

## ✨ Key Features

### 🔁 Graph-Based Transfer Cycle Engine
At the heart of the system is `CycleEngineService`. For a selected discipline, it:
1. Fetches all employees with an **APPROVED** transfer request.
2. Constructs a **directed graph** where an edge from Employee A → Employee B exists only if B's current location is in A's preferences and level-gating policy permits the move.
3. Runs a **DFS-based cycle detection** algorithm to enumerate all valid closed loops (configurable `max_cycle_length`, default 5).
4. **Deduplicates** cycles via canonical normalization and selects a non-overlapping set using a greedy algorithm sorted by descending average NLP score.

This guarantees that every executed transfer is part of a self-contained loop — no employee is moved to a vacancy that doesn't simultaneously produce a vacancy for someone else.

### 🤖 NLP-Powered Match Scoring
Using the `all-MiniLM-L6-v2` sentence transformer model (loaded as a process-wide singleton via `NLPModelManager`), the system:
- Encodes each employee's **assignment titles and skills** from their active `TenureRecord` into a dense embedding vector.
- Encodes the **historical role profile** of every candidate target position (from the most recent completed `TenureRecord` at that position).
- Computes **cosine similarity** between these vectors to produce a `[0.0, 1.0]` match score for every potential transfer edge and successor suggestion.

This same mechanism powers both the **Cycle Engine** (edge scoring) and the **Successor Suggestion** feature (ranking candidates to backfill a vacated position).

### ⚡ Single-Click Atomic Cycle Execution
The Transfer Head's **Cycle Inspector** UI presents ranked cycles with a visual flow diagram for each. The Transfer Head can:
- **Exempt** specific employees from a cycle (they remain in `APPROVED` state for the next generation).
- **Regenerate** cycles on demand with updated exemptions.
- **Execute** a cycle with a single confirmation click.

On execution, the backend runs an **atomic nested transaction** that simultaneously:
- Closes the current `TenureRecord` for every employee in the cycle.
- Opens a new `TenureRecord` at the new position.
- Updates `Employee.current_position_id`.
- Flips the `TransferRequest` status to `COMPLETED`.

If any step fails, the entire batch is rolled back.

### 🛡️ Configurable Rotation Policies
Policies are stored as JSONB documents in a `RotationPolicy` table and can be scoped **GLOBALLY** or **per-LOCATION**:
- **Tenure Rules:** Minimum lock-in period (default 3 years) and maximum tenure limit (default 10 years).
- **Level Gating:** Define which grade levels allow only lateral moves (`lateral_only`) and which permit promotion-eligible transfers (`promotions_allowed`).
- **Capacity Caps:** Per-`(department, discipline, level)` triplet via `DepartmentDisciplineCapacity` — the NLP matching engine will not suggest a position that would breach its department's headcount ceiling.

### 🔔 Mandatory Transfer Alerts
The system proactively surfaces employees approaching or exceeding their maximum permitted tenure at a posting, categorized as:
- `MANDATORY_N_YEAR_TRANSFER` — approaching the limit within the final year.
- `OVERDUE_N_YEAR_TRANSFER` — already past the limit.

These alerts are visible to Department Heads, Location Heads, and the Transfer Head.

### 📋 Formal Multi-Role Workflow
Transfers flow through a structured pipeline with full audit trails:

```
Employee (submits preferences)
    ↓
Department Head (initiates proposal, reviews team)
    ↓
Location Head (reviews & approves for their jurisdiction)
    ↓
Transfer Head (NLP cycle generation → execution)
    ↓
Employee (appeal window with privacy-gated exemption context)
```

The appeal stage exposes sensitive context — approved medical records, children in board-exam years (Class 9/11) — **only** when a transfer is actively in the `APPEALED` status, acting as a privacy gateway.

### 📊 Global Requests Overview Dashboard
The Transfer Head has a unified searchable and filterable table of all active transfer requests across the organization, showing:
- **Live KPI cards:** Total, Proposed, Approved, Appealed counts.
- **Full-text search** by employee name, ID, discipline, department, or location.
- **Status filter** and revocation actions for Transfer-Head-initiated requests.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React 19 Frontend                 │
│  (Vite · React Router v7 · Tailwind CSS v4 · Axios) │
│                                                     │
│  ┌───────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Employee  │  │  Dept/Loc    │  │  Transfer   │  │
│  │  Portal   │  │  Head Views  │  │  Head Suite │  │
│  └─────┬─────┘  └──────┬───────┘  └──────┬──────┘  │
└────────┼───────────────┼─────────────────┼──────────┘
         │               │  HTTP / REST    │
         ▼               ▼                 ▼
┌─────────────────────────────────────────────────────┐
│             FastAPI Application (Uvicorn)            │
│                                                     │
│  /me   /auth   /dept-head   /loc-head   /transfer-  │
│                             /med-officer  head       │
│                                                     │
│  ┌───────────────┐   ┌──────────────────────────┐   │
│  │ TransferService│   │    CycleEngineService    │   │
│  │  (Workflow &  │   │  ┌──────────────────────┐│   │
│  │   Lifecycle)  │   │  │  1. Build Emp Graph  ││   │
│  └───────────────┘   │  │  2. DFS Cycle Find   ││   │
│                      │  │  3. Batch NLP Encode ││   │
│  ┌───────────────┐   │  │  4. Cosine Scoring   ││   │
│  │MatchingService│   │  │  5. Greedy Selection ││   │
│  │ (NLP Suggest) │   │  │  6. Atomic Execute   ││   │
│  └───────────────┘   │  └──────────────────────┘│   │
│                      └──────────────────────────┘   │
└─────────────────────────────┬───────────────────────┘
                              │ SQLAlchemy ORM
                              ▼
┌─────────────────────────────────────────────────────┐
│                    PostgreSQL                        │
│  employee · positions · tenurerecord · assignment   │
│  transferrequest · rotationpolicy · location        │
│  discipline · department · departmentdiscipline-    │
│  capacity · roles · emp_role · medical · dependent  │
└─────────────────────────────────────────────────────┘
                              │
                    sentence-transformers
                    (all-MiniLM-L6-v2)
                    Process-level singleton
```

### Cycle Engine Pipeline (Step-by-Step)

| Step | What Happens |
|------|-------------|
| **1. Candidate Query** | Fetches all active employees in the selected discipline who have an `APPROVED` transfer request. |
| **2. Graph Construction** | Builds a directed adjacency list. An edge A→B is added only if B's location is in A's preferences AND level-gating policy (global + local) permits the move. |
| **3. DFS Cycle Detection** | Iterates over all start nodes; DFS explores paths up to `max_cycle_length`. Closed loops are deduplicated by canonical normalization (rotation to smallest node ID). |
| **4. Batch NLP Encoding** | All employee texts and position history texts are batch-encoded in two passes using the singleton `SentenceTransformer` model. |
| **5. Edge Scoring** | Each directed edge is scored by `cos_sim(employee_embedding, target_position_embedding)`. Cycle score = average of all edge scores. |
| **6. Greedy Non-Overlapping Selection** | Cycles are sorted descending by score. Greedily selected if none of their employees are already claimed by a higher-scoring cycle. |
| **7. Atomic Execution** | On Transfer Head confirmation: `db.begin_nested()` wraps all position swaps, tenure record rotations, and status updates. Rolled back entirely on any failure. |

---

## 🗂️ Project Structure

```
HR-Management-System/
│
├── backend/
│   ├── main.py                  # FastAPI app factory, CORS, router registration
│   ├── database.py              # SQLAlchemy engine & session factory (reads .env)
│   ├── models.py                # 14 ORM models + 2 DB views + Enum definitions
│   ├── schemas.py               # Pydantic request/response schemas
│   ├── requirements.txt         # Python dependencies
│   │
│   ├── routers/
│   │   ├── employee.py          # Employee self-service endpoints (/me)
│   │   ├── login.py             # Authentication (/auth)
│   │   ├── Department_head.py   # Department Head jurisdiction endpoints
│   │   ├── Location_head.py     # Location Head management endpoints
│   │   ├── Medical_officer.py   # Medical Officer record endpoints
│   │   ├── policy.py            # Rotation policy CRUD (/api)
│   │   └── Transfer_head.py     # Cycle generation, execution, overview (/transfer-head)
│   │
│   └── services/
│       ├── cycle_engine_service.py   # Graph engine: build, detect, score, execute
│       ├── matching_service.py       # NLP matching: successors & next positions
│       └── transfer_service.py       # Transfer lifecycle & mandatory alert logic
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    │
    └── src/
        ├── App.jsx              # Root router with role-based protected routes
        ├── main.jsx             # React DOM entry point
        │
        ├── api/
        │   ├── axios.js         # Axios instance with base URL & auth headers
        │   └── roleApi.js       # Typed API call functions per role
        │
        ├── layouts/
        │   └── EmployeeLayout.jsx   # Shared shell with SideBar
        │
        ├── components/
        │   ├── SideBar.jsx               # Role-aware collapsible sidebar
        │   ├── ProtectedRoute.jsx        # Role-gated route guard
        │   ├── transfer-head/
        │   │   ├── TransferHeadInitiateTransfer.jsx   # Manual transfer initiation
        │   │   └── TransferHeadAppealsDashboard.jsx   # Appeal review UI
        │   ├── manager/                  # Shared manager-tier widgets
        │   ├── dept-head/                # Department Head specific components
        │   ├── loc-head/                 # Location Head specific components
        │   └── shared/                   # Cross-role reusable components
        │
        └── pages/
            ├── LoginPage.jsx
            ├── EmployeeDashboard.jsx
            ├── EmployeeProfilePage.jsx
            ├── TransferRequestsPage.jsx
            ├── ManagerDashboardPage.jsx
            ├── TransferHeadDashboardPage.jsx        # Cycle Inspector + Overview
            └── TransferHeadVoluntaryRequestsPage.jsx
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend Framework** | React | 19 |
| **Build Tool** | Vite | 8 |
| **Styling** | Tailwind CSS | v4 |
| **Routing** | React Router DOM | v7 |
| **HTTP Client** | Axios | ^1.18 |
| **Icons** | Lucide React | ^1.21 |
| **Backend Framework** | FastAPI | Latest |
| **ASGI Server** | Uvicorn | Latest |
| **ORM** | SQLAlchemy | 2.x |
| **Database** | PostgreSQL | Latest |
| **DB Driver** | psycopg2-binary | Latest |
| **AI / NLP Model** | sentence-transformers (`all-MiniLM-L6-v2`) | Latest |
| **Environment Config** | python-dotenv | Latest |
| **Linting (Frontend)** | OxLint | ^1.69 |

---

## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have the following installed:
- **Python** >= 3.10
- **Node.js** >= 20 and **npm** >= 10
- **PostgreSQL** server running and accessible
- **Git**

---

### 1. Clone the Repository

```bash
git clone https://github.com/Amishi24/HR-Management-System.git
cd HR-Management-System
```

---

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv .venv

# On Windows
.venv\Scripts\activate

# On macOS/Linux
source .venv/bin/activate

# Install all dependencies
pip install -r requirements.txt
```

> **Note:** The first time `sentence-transformers` is used, it will automatically download the `all-MiniLM-L6-v2` model (~90 MB). An internet connection is required for the initial download.

#### Configure the Environment

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/your_database_name
```

#### Run the Backend Server

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.  
Interactive API documentation (Swagger UI) is available at `http://localhost:8000/docs`.

---

### 3. Frontend Setup

Open a new terminal from the project root:

```bash
# Navigate to the frontend directory
cd frontend

# Install all Node dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## 🔑 Environment Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `DATABASE_URL` | Full PostgreSQL connection string for SQLAlchemy | `postgresql://admin:password@localhost:5432/hr_db` |

---

## 📡 API Overview

The FastAPI backend exposes a fully documented REST API. All endpoints are browsable interactively at **`http://localhost:8000/docs`** once the server is running.

| Prefix | Router File | Role | Description |
|--------|------------|------|-------------|
| `/auth` | `login.py` | Public | User authentication |
| `/me` | `employee.py` | Employee | Self-service profile, preferences, transfer status |
| `/dept-head` | `Department_head.py` | Dept Head | Team management, transfer initiation, review queue |
| `/loc-head` | `Location_head.py` | Location Head | Location management, positions, transfer approval |
| `/med-officer` | `Medical_officer.py` | Medical Officer | Medical record management |
| `/api` | `policy.py` | Admin | Rotation policy CRUD (global & local) |
| `/transfer-head` | `Transfer_head.py` | Transfer Head | Cycle generation, execution, global overview, appeals |

### Key Transfer Head Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/transfer-head/approved-employees` | List all employees ready for cycle generation |
| `POST` | `/transfer-head/cycle/generate` | Generate optimal NLP-scored transfer cycles for a discipline |
| `POST` | `/transfer-head/cycle/execute` | Atomically execute a confirmed transfer cycle |
| `GET` | `/transfer-head/requests/overview` | Global dashboard of all active transfer requests |
| `GET` | `/transfer-head/transfers/eligible` | List all employees who have completed mandatory tenure |

---

## 👥 User Roles

| Role | Key Capabilities |
|------|----------------|
| **Employee** | View profile, submit location preferences, track transfer request status, file an appeal |
| **Department Head** | View team roster, initiate mandatory transfers, review proposed requests within jurisdiction |
| **Location Head** | Manage location and positions, approve/reject proposals, run NLP-based successor suggestions |
| **Medical Officer** | Review and approve medical exemption records submitted by employees |
| **Transfer Head** | Full organizational oversight: generate and execute transfer cycles, manage appeals, view global request pipeline |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. **Fork** the repository.
2. Create your feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add some feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a **Pull Request** against the `main` branch.

Please ensure your code follows existing conventions and that any new backend endpoints include appropriate role-based dependency guards.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---


