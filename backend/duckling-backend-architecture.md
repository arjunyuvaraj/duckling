# Duckling Backend Architecture

> A high-school coding practice ecosystem combining HackerRank, LeetCode, CodingBat with AI-generated assignments and lightweight classroom tooling.

**Philosophy**: Lightweight, modern, developer-first, non-academic, modular, scalable.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Service Boundaries](#service-boundaries)
4. [Database Schema](#database-schema)
5. [API Routes](#api-routes)
6. [Queue & Event Architecture](#queue--event-architecture)
7. [Execution Sandbox](#execution-sandbox)
8. [AI Generation Pipeline](#ai-generation-pipeline)
9. [Security Considerations](#security-considerations)
10. [Scaling Considerations](#scaling-considerations)
11. [Folder Structure](#folder-structure)
12. [Local Development Setup](#local-development-setup)
13. [Testing Strategy](#testing-strategy)
14. [Docker Strategy](#docker-strategy)
15. [Example API Payloads](#example-api-payloads)
16. [Example Execution Flows](#example-execution-flows)
17. [Example Assignment Generation](#example-assignment-generation)
18. [Submission Lifecycle](#submission-lifecycle)
19. [Observability & Logging](#observability--logging)
20. [Deployment Architecture](#deployment-architecture)
21. [Developer CLI Specification](#developer-cli-specification)
22. [Example CLI Workflow](#example-cli-workflow)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend                          │
│                   (Vercel/Netlify)                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ REST + WebSocket
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                                                             │
│              DUCKLING API SERVER (FastAPI)                  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Auth Svc   │  │  Class Svc   │  │ Problem Svc  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │Assignment Svc│  │Submission Svc │  │  Trail Svc   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Playground   │  │ Analytics    │  │ AI Pipeline  │       │
│  │   Svc        │  │   Svc        │  │   Svc        │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                             │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┬────────────┐
        │          │          │            │
        │          │          │            │
    ┌───▼──┐  ┌───▼──┐  ┌───▼──┐  ┌──────▼──┐
    │  Pg  │  │Redis │  │ Job  │  │ Storage │
    │  SQL │  │Cache │  │Queue │  │ (S3)    │
    └──────┘  └──────┘  └──────┘  └─────────┘
        │          │          │
        └──────────┼──────────┘
                   │
        ┌──────────▼──────────┐
        │  Execution Workers   │
        │  (Sandboxed Docker)  │
        └──────────────────────┘
```

### Core Principles

1. **Modular Monolith** — Single FastAPI application with domain-driven services
2. **Async-first** — All I/O is async (database, queue, network)
3. **Event-driven** — Major actions publish events for analytics, notifications, AI pipelines
4. **Sandbox isolation** — All user code executes in ephemeral Docker containers
5. **Language-agnostic problems** — Problems are problem first, language adapters second
6. **Submission polymorphism** — Homework, practice, playground, competition use identical submission flow
7. **Validation gates** — AI-generated content never auto-publishes; strict validation pipeline

---

## Tech Stack

### Runtime & Framework

- **Language**: Python 3.11+
- **Framework**: FastAPI (async, auto-docs, dependency injection)
- **Server**: Uvicorn (production ASGI)
- **Type checking**: Pydantic v2, mypy

### Database & Storage

- **Primary DB**: PostgreSQL 15+ (Supabase or self-hosted)
- **Cache/Sessions**: Redis 7+ (Upstash or self-hosted)
- **File Storage**: AWS S3 or Cloudflare R2 (code submissions, generated assets)
- **Search**: PostgreSQL full-text search (simple) or Typesense (later scale)

### Queues & Jobs

- **Message Queue**: Celery + Redis (job submissions, AI generation, analytics)
- **Alternative**: Bull Queue (if moving to Node.js later)
- **Job persistence**: PostgreSQL

### Execution & Sandboxing

- **Runtime**: Docker (ephemeral containers)
- **Orchestration**: Docker Compose (dev), Nomad or Kubernetes (prod)
- **Languages**: Python, Java, JavaScript (pluggable executors)
- **Resource limits**: cgroups (memory, CPU, timeout)
- **Network isolation**: No network access in containers

### External Services

- **LLM**: OpenAI API (GPT-4 for assignment generation)
- **Auth**: JWT tokens stored in browser; optional: Auth0 (future)
- **Monitoring**: Sentry (error tracking), Datadog or Prometheus (metrics)
- **Logging**: Structured JSON logs to Loki or CloudWatch

### Development

- **Testing**: pytest, pytest-asyncio, fixtures
- **Code quality**: Black, isort, flake8, mypy
- **API docs**: Swagger/OpenAPI (auto-generated by FastAPI)
- **Environment**: direnv, python-dotenv

---

## Service Boundaries

Each service is a logical domain, NOT a separate microservice (yet). All live in the same FastAPI app under `/app/services/`.

### 1. **Auth Service** (`auth`)

- User registration, login, logout
- JWT token generation & validation
- Role assignment (student, teacher, admin)
- Password reset flows
- OAuth prep (Google, GitHub)

### 2. **User Service** (`users`)

- User profile CRUD
- Preferences (language, difficulty, interests)
- User statistics (submissions, problems solved)
- Achievement/badge tracking

### 3. **Class Service** (`classes`)

- Class (Pond) creation & management
- Enrollment/roster management
- Class settings (language, difficulty, access)
- Classroom analytics access

### 4. **Problem Service** (`problems`)

- Problem CRUD with full versioning
- Language-specific implementations
- Test case management
- Difficulty/category tagging
- Problem search & filtering
- Skeleton code templates

### 5. **Assignment Service** (`assignments`)

- Assignment creation & assignment
- References to problem bank (not ownership)
- Deadline tracking
- Progress aggregation per student
- Assignment analytics

### 6. **Submission Service** (`submissions`)

- Submission CRUD (homework, practice, playground, competition)
- Submission state machine (draft → queued → running → complete)
- Result storage (passed/failed/error)
- Retry logic

### 7. **Execution Service** (`execution`)

- Queue submission jobs
- Monitor job status
- Fetch results
- Timeout/resource limit enforcement
- Execution logs & debugging output

### 8. **Trail Service** (`trails`)

- Trail (Flight Path) definition & progression
- Skill tree/prerequisite mapping
- Student progress tracking
- Recommendation engine hooks

### 9. **Playground Service** (`playground`)

- Ephemeral project creation
- File management (code, assets)
- Real-time collaboration prep (WebSocket)
- Auto-save management

### 10. **AI Pipeline Service** (`ai_pipeline`)

- Generation request intake
- Concept extraction
- Template retrieval
- LLM prompt execution
- Test case generation
- Difficulty estimation
- Plagiarism check (optional)
- Validation orchestration
- Publishing workflow

### 11. **Analytics Service** (`analytics`)

- Event ingestion from other services
- Student progress aggregation
- Teacher dashboards
- Problem difficulty calibration
- Recommendation data prep

### 12. **Notification Service** (`notifications`)

- Event-driven notifications
- Grade updates, assignment deadlines
- Email/push integration (future)

---

## Database Schema

### Core Tables

```sql
-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'student', 'teacher', 'admin'
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    deleted_at TIMESTAMP,
    INDEX(email), INDEX(role)
);

-- Classes (Ponds)
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    teacher_id INT NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    code VARCHAR(20) UNIQUE NOT NULL, -- join code
    language_focus VARCHAR(50), -- 'python', 'java', 'javascript', or null for mixed
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    INDEX(teacher_id), INDEX(code)
);

-- Enrollments
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    class_id INT NOT NULL REFERENCES classes(id),
    student_id INT NOT NULL REFERENCES users(id),
    enrolled_at TIMESTAMP DEFAULT now(),
    UNIQUE(class_id, student_id),
    INDEX(class_id), INDEX(student_id)
);

-- Problems (language-agnostic)
CREATE TABLE problems (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL, -- 'easy', 'medium', 'hard'
    category VARCHAR(100),
    estimated_time_minutes INT,
    is_published BOOLEAN DEFAULT true,
    created_by INT REFERENCES users(id), -- teacher/curator who created it
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    version INT DEFAULT 1,
    INDEX(difficulty), INDEX(category), INDEX(slug), FULLTEXT INDEX(title, description)
);

-- Problem Implementations (language-specific)
CREATE TABLE problem_implementations (
    id SERIAL PRIMARY KEY,
    problem_id INT NOT NULL REFERENCES problems(id),
    language VARCHAR(50) NOT NULL, -- 'python', 'java', 'javascript'
    skeleton_code TEXT,
    solution_code TEXT,
    hidden_code TEXT, -- setup code students don't see
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(problem_id, language),
    INDEX(problem_id)
);

-- Test Cases
CREATE TABLE test_cases (
    id SERIAL PRIMARY KEY,
    problem_id INT NOT NULL REFERENCES problems(id),
    language VARCHAR(50), -- null = all languages
    input_json TEXT NOT NULL,
    expected_output_json TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT false, -- visible in playground, hidden in submissions
    created_at TIMESTAMP DEFAULT now(),
    INDEX(problem_id), INDEX(is_hidden)
);

-- Assignments
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    class_id INT NOT NULL REFERENCES classes(id),
    problem_id INT NOT NULL REFERENCES problems(id), -- reference, not ownership
    title VARCHAR(255),
    instructions TEXT,
    assigned_at TIMESTAMP DEFAULT now(),
    due_at TIMESTAMP,
    created_by INT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    INDEX(class_id), INDEX(problem_id), INDEX(due_at)
);

-- Submissions (polymorphic: homework/practice/playground/competition)
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES users(id),
    problem_id INT NOT NULL REFERENCES problems(id),
    assignment_id INT REFERENCES assignments(id), -- null for practice/playground
    language VARCHAR(50) NOT NULL,
    code TEXT NOT NULL,
    submission_type VARCHAR(50) DEFAULT 'practice', -- 'homework', 'practice', 'playground', 'competition'
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'queued', 'running', 'completed', 'error'
    result VARCHAR(50), -- 'passed', 'failed', 'timeout', 'runtime_error'
    execution_time_ms INT,
    memory_used_mb INT,
    passed_tests INT,
    total_tests INT,
    output_json TEXT, -- test results
    error_message TEXT,
    job_id VARCHAR(255), -- queue job reference
    submitted_at TIMESTAMP DEFAULT now(),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    INDEX(student_id), INDEX(problem_id), INDEX(assignment_id), INDEX(status), INDEX(submission_type)
);

-- Execution Jobs (for queue state tracking)
CREATE TABLE execution_jobs (
    id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL REFERENCES submissions(id),
    job_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'running', 'completed', 'failed', 'timeout'
    worker_id VARCHAR(255), -- which worker picked this up
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    timeout_seconds INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    INDEX(submission_id), INDEX(job_id), INDEX(status)
);

-- Trails (Flight Paths)
CREATE TABLE trails (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    language VARCHAR(50),
    skill_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    INDEX(language)
);

-- Trail Milestones (ordered problems in a trail)
CREATE TABLE trail_milestones (
    id SERIAL PRIMARY KEY,
    trail_id INT NOT NULL REFERENCES trails(id),
    problem_id INT NOT NULL REFERENCES problems(id),
    order_index INT NOT NULL,
    is_prerequisite BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE(trail_id, problem_id),
    INDEX(trail_id)
);

-- Student Trail Progress
CREATE TABLE trail_progress (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES users(id),
    trail_id INT NOT NULL REFERENCES trails(id),
    milestone_id INT NOT NULL REFERENCES trail_milestones(id),
    status VARCHAR(50) DEFAULT 'locked', -- 'locked', 'unlocked', 'in_progress', 'completed'
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE(student_id, trail_id, milestone_id),
    INDEX(student_id), INDEX(trail_id)
);

-- Playground Projects
CREATE TABLE playground_projects (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    language VARCHAR(50) NOT NULL,
    description TEXT,
    code TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    INDEX(student_id)
);

-- AI Generation Requests
CREATE TABLE ai_generation_requests (
    id SERIAL PRIMARY KEY,
    teacher_id INT NOT NULL REFERENCES users(id),
    concept VARCHAR(255) NOT NULL,
    skill_level VARCHAR(50),
    language VARCHAR(50),
    count INT DEFAULT 1,
    prompt TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'generating', 'generated', 'failed'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT now(),
    completed_at TIMESTAMP,
    INDEX(teacher_id), INDEX(status)
);

-- Generated Problems (with lineage)
CREATE TABLE generated_problems (
    id SERIAL PRIMARY KEY,
    problem_id INT REFERENCES problems(id), -- links to published problem (null until published)
    generation_request_id INT NOT NULL REFERENCES ai_generation_requests(id),
    prompt TEXT NOT NULL,
    raw_llm_output TEXT,
    validation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'passed', 'failed'
    validation_logs TEXT,
    plagiarism_score FLOAT,
    teacher_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    INDEX(generation_request_id), INDEX(validation_status)
);

-- Analytics Events
CREATE TABLE analytics_events (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    event_type VARCHAR(100) NOT NULL, -- 'submission_created', 'submission_completed', 'problem_viewed', etc.
    event_data JSONB,
    created_at TIMESTAMP DEFAULT now(),
    INDEX(user_id), INDEX(event_type), INDEX(created_at)
);
```

### Key Design Decisions

1. **Assignments reference Problems** — Problems are reusable; assignments are the teaching context
2. **Submissions are polymorphic** — Same flow for homework, practice, playground, competition
3. **Problem implementations are language-specific adapters** — Problem is language-agnostic first
4. **Test cases store JSON** — Input/output are language-agnostic JSON
5. **Generated problems track lineage** — Full audit trail: prompt → LLM → validation → publishing
6. **Analytics events are JSON** — Flexible event schema for future expansion
7. **Soft deletes not shown** — `deleted_at` column on users for GDPR, simple archive pattern

---

## API Routes

All routes prefixed with `/api/v1/`.

### Auth Routes

```
POST   /auth/register          - Register new user
POST   /auth/login             - Login, receive JWT
POST   /auth/logout            - Invalidate token
POST   /auth/refresh           - Refresh JWT
POST   /auth/password-reset    - Request password reset email
POST   /auth/password-reset/:token - Confirm password reset
GET    /auth/me                - Get current user
```

### User Routes

```
GET    /users/:user_id         - Get user profile
PATCH  /users/:user_id         - Update user profile
GET    /users/:user_id/stats   - User statistics (problems solved, streak, etc.)
GET    /users/:user_id/achievements - Badges & achievements
```

### Class Routes

```
POST   /classes                - Create class (teacher only)
GET    /classes                - List user's classes
GET    /classes/:class_id      - Get class details
PATCH  /classes/:class_id      - Update class
DELETE /classes/:class_id      - Delete class
POST   /classes/:class_id/join - Join class with code (student)
GET    /classes/:class_id/members - List enrolled students
DELETE /classes/:class_id/members/:student_id - Remove student
GET    /classes/:class_id/analytics - Class analytics (teacher only)
```

### Problem Routes

```
GET    /problems               - List/search problems
GET    /problems/:problem_id   - Get problem details
POST   /problems               - Create problem (teacher/curator only)
PATCH  /problems/:problem_id   - Update problem
DELETE /problems/:problem_id   - Delete problem
GET    /problems/:problem_id/implementations/:language - Get language-specific implementation
POST   /problems/:problem_id/implementations/:language - Add/update implementation
GET    /problems/:problem_id/test-cases - Get test cases (visible ones)
POST   /problems/:problem_id/test-cases - Create test case
```

### Assignment Routes

```
POST   /assignments            - Create assignment (teacher only)
GET    /classes/:class_id/assignments - List class assignments
GET    /assignments/:assignment_id - Get assignment details
PATCH  /assignments/:assignment_id - Update assignment
DELETE /assignments/:assignment_id - Delete assignment
GET    /assignments/:assignment_id/progress - Get student progress on assignment
```

### Submission Routes

```
POST   /submissions            - Submit code
GET    /submissions            - List user's submissions
GET    /submissions/:submission_id - Get submission details
GET    /submissions/:submission_id/result - Poll for result (WebSocket preferred)
GET    /problems/:problem_id/submissions - My submissions for this problem
```

### Execution Routes

```
GET    /execution/jobs/:job_id - Get job status
WS     /execution/ws/:job_id   - WebSocket for real-time updates
POST   /execution/test         - Test execution (sandbox testing)
```

### Trail Routes

```
GET    /trails                 - List available trails
GET    /trails/:trail_id       - Get trail details
GET    /trails/:trail_id/progress - Get student progress
POST   /trails/:trail_id/start - Start trail
PATCH  /trails/:trail_id/progress/:milestone_id - Update milestone progress
```

### Playground Routes

```
POST   /playground/projects    - Create project
GET    /playground/projects    - List user's projects
GET    /playground/projects/:project_id - Get project
PATCH  /playground/projects/:project_id - Update project
DELETE /playground/projects/:project_id - Delete project
POST   /playground/projects/:project_id/execute - Run code
```

### AI Pipeline Routes

```
POST   /ai/generate-assignments - Request assignment generation
GET    /ai/generation-requests/:request_id - Get generation status
GET    /ai/generated-problems/:generated_problem_id - Review generated problem
PATCH  /ai/generated-problems/:generated_problem_id/approve - Teacher approval
PATCH  /ai/generated-problems/:generated_problem_id/reject - Teacher rejection
GET    /ai/generation-requests/:request_id/generated-problems - List generated problems
```

### Analytics Routes

```
GET    /analytics/me/summary   - Student dashboard
GET    /analytics/me/submissions - My submission history
GET    /analytics/me/progress  - My progress across trails
GET    /classes/:class_id/analytics - Teacher class analytics
GET    /analytics/problems/:problem_id/stats - Problem difficulty calibration (admin)
```

---

## Queue & Event Architecture

### Job Queue (Celery + Redis)

All long-running operations are queued.

#### Job Types

1. **Execution Job** — Run user code
   - Input: submission_id, code, language, test_cases
   - Output: results, execution_time, memory, errors
   - Timeout: 30 seconds per test case
   - Retry: 3 times on transient failure

2. **AI Generation Job** — Generate problems from LLM
   - Input: concept, skill_level, language, count
   - Output: generated_problem records
   - Timeout: 120 seconds
   - Callback: Publish event for validation pipeline

3. **Validation Job** — Validate generated problem
   - Input: generated_problem_id
   - Output: validation_status, validation_logs, plagiarism_score
   - Timeout: 60 seconds
   - Callback: Publish event for teacher review

4. **Analytics Aggregation** — Compute class/student stats
   - Input: class_id or user_id
   - Output: aggregated metrics
   - Timeout: 300 seconds
   - Schedule: Every hour, or on-demand

5. **Plagiarism Check** — Compare generated problems with seed data
   - Input: generated_problem_id
   - Output: similarity scores
   - Timeout: 120 seconds

### Event System

Events are published to Redis pubsub for real-time updates and async processing.

#### Event Types

```python
class EventType(str, Enum):
    # Submission events
    SUBMISSION_CREATED = "submission.created"
    SUBMISSION_STARTED = "submission.started"
    SUBMISSION_COMPLETED = "submission.completed"
    SUBMISSION_FAILED = "submission.failed"

    # Problem events
    PROBLEM_CREATED = "problem.created"
    PROBLEM_PUBLISHED = "problem.published"

    # Assignment events
    ASSIGNMENT_CREATED = "assignment.created"
    ASSIGNMENT_DUE_SOON = "assignment.due_soon"  # 24h before

    # Class events
    STUDENT_ENROLLED = "student.enrolled"
    STUDENT_LEFT = "student.left"

    # AI events
    GENERATION_STARTED = "generation.started"
    GENERATION_COMPLETED = "generation.completed"
    VALIDATION_PASSED = "validation.passed"
    VALIDATION_FAILED = "validation.failed"

    # Analytics
    STATS_UPDATED = "stats.updated"
```

#### Event Subscribers

- **WebSocket Handler** — Real-time UI updates
- **Notification Service** — Email/push notifications
- **Analytics Service** — Event ingestion, metrics computation
- **Logging Service** — Structured event logging
- **Recommendation Engine** — Trail progression, skill gaps

### Queue Configuration

```yaml
# celery_config.py
broker_url: "redis://localhost:6379/0"
result_backend: "redis://localhost:6379/1"
task_serializer: "json"
accept_content: ["json"]
task_compression: "gzip"
task_protocol: 2
task_track_started: True
task_time_limit: 600 # hard limit
task_soft_time_limit: 580 # warning before hard limit
worker_prefetch_multiplier: 1 # one task per worker at a time
worker_max_tasks_per_child: 100 # worker restart after 100 tasks
```

---

## Execution Sandbox

### Architecture

```
User Submission
    ↓
API enqueues execution job
    ↓
Worker picks up job
    ↓
Create ephemeral Docker container
    ↓
Copy user code + test cases into container
    ↓
Execute code with resource limits
    ↓
Capture stdout, stderr, exit code
    ↓
Parse test results
    ↓
Destroy container
    ↓
Update submission record
    ↓
Publish event
```

### Dockerfile for Executor

```dockerfile
FROM python:3.11-slim

WORKDIR /sandbox

# Install Java and Node
RUN apt-get update && apt-get install -y \
    openjdk-17-jre-headless \
    nodejs npm \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m sandbox

# Set resource limits
USER sandbox

# Copy executor entry point
COPY executor.py /sandbox/

ENTRYPOINT ["python", "/sandbox/executor.py"]
```

### Executor Script

```python
# executor.py
import json
import sys
import subprocess
import traceback
import signal
import os
from pathlib import Path
from dataclasses import dataclass

TIMEOUT = 30
MEMORY_LIMIT = "512m"
CPU_SHARES = 1024

@dataclass
class ExecutionResult:
    success: bool
    output: str
    error: str
    exit_code: int
    duration_ms: int
    test_results: list

def execute_python(code: str, test_cases: list) -> ExecutionResult:
    """Execute Python code against test cases."""
    try:
        # Create temporary Python file
        code_file = Path("/tmp/solution.py")
        code_file.write_text(code)

        passed = 0
        failed = 0
        test_results = []

        for test_case in test_cases:
            input_data = json.dumps(test_case["input"])
            expected_output = test_case["expected_output"]

            try:
                result = subprocess.run(
                    [sys.executable, str(code_file)],
                    input=input_data,
                    capture_output=True,
                    text=True,
                    timeout=TIMEOUT,
                )

                actual_output = result.stdout.strip()
                passed_test = actual_output == expected_output

                if passed_test:
                    passed += 1
                else:
                    failed += 1

                test_results.append({
                    "input": test_case["input"],
                    "expected": expected_output,
                    "actual": actual_output,
                    "passed": passed_test,
                    "stderr": result.stderr or None,
                })
            except subprocess.TimeoutExpired:
                failed += 1
                test_results.append({
                    "input": test_case["input"],
                    "error": "TIMEOUT",
                    "passed": False,
                })

        return ExecutionResult(
            success=failed == 0,
            output="",
            error="",
            exit_code=0,
            duration_ms=0,
            test_results=test_results,
        )

    except Exception as e:
        return ExecutionResult(
            success=False,
            output="",
            error=str(e),
            exit_code=1,
            duration_ms=0,
            test_results=[],
        )

def execute_java(code: str, test_cases: list) -> ExecutionResult:
    """Execute Java code against test cases."""
    # Similar pattern, compile then run
    pass

def execute_javascript(code: str, test_cases: list) -> ExecutionResult:
    """Execute JavaScript code against test cases."""
    # Similar pattern using Node.js
    pass

if __name__ == "__main__":
    request = json.loads(sys.stdin.read())
    language = request["language"]
    code = request["code"]
    test_cases = request["test_cases"]

    if language == "python":
        result = execute_python(code, test_cases)
    elif language == "java":
        result = execute_java(code, test_cases)
    elif language == "javascript":
        result = execute_javascript(code, test_cases)
    else:
        result = ExecutionResult(
            success=False,
            output="",
            error=f"Unsupported language: {language}",
            exit_code=1,
            duration_ms=0,
            test_results=[],
        )

    print(json.dumps(result.__dict__))
```

### Execution Worker (Celery Task)

```python
# app/tasks/execution.py
from celery import shared_task
import docker
import json
import tempfile
from pathlib import Path

client = docker.from_env()

@shared_task(bind=True, max_retries=3)
def execute_submission(self, submission_id: int):
    """
    Execute a submission against test cases.
    """
    from app.db import get_session
    from app.models import Submission

    session = get_session()
    submission = session.query(Submission).get(submission_id)

    if not submission:
        raise ValueError(f"Submission {submission_id} not found")

    try:
        # Prepare execution payload
        payload = {
            "language": submission.language,
            "code": submission.code,
            "test_cases": [
                {
                    "input": tc.input_json,
                    "expected_output": tc.expected_output_json,
                }
                for tc in submission.problem.test_cases
                if not tc.is_hidden  # Only visible test cases
            ],
        }

        # Run in Docker container
        container = client.containers.run(
            "duckling-executor:latest",
            stdin=True,
            stdout=True,
            stderr=True,
            remove=True,
            timeout=60,
            mem_limit=MEMORY_LIMIT,
        )

        output = container.wait(timeout=60)
        result = json.loads(output)

        # Update submission record
        submission.status = "completed"
        submission.result = "passed" if result["success"] else "failed"
        submission.test_results = result["test_results"]
        submission.passed_tests = sum(1 for tr in result["test_results"] if tr["passed"])
        submission.total_tests = len(result["test_results"])
        submission.completed_at = datetime.now()

        session.commit()

        # Publish event
        publish_event("submission.completed", {
            "submission_id": submission_id,
            "result": submission.result,
            "passed_tests": submission.passed_tests,
        })

        return {"status": "completed", "submission_id": submission_id}

    except Exception as e:
        submission.status = "error"
        submission.error_message = str(e)
        submission.completed_at = datetime.now()
        session.commit()

        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=2 ** self.request.retries)
```

### Resource Limits

- **Memory**: 512 MB per execution
- **CPU**: 1 core (via cpu_shares)
- **Timeout**: 30 seconds per submission
- **Network**: Disabled (no internet access)
- **Filesystem**: Read-only except /tmp

---

## AI Generation Pipeline

### Overview

```
Teacher Request
    ↓
Concept Extraction
    ↓
Template Retrieval
    ↓
LLM Prompt Generation
    ↓
LLM Call (GPT-4)
    ↓
Output Parsing
    ↓
Hidden Test Generation
    ↓
Difficulty Estimation
    ↓
Sandbox Verification
    ↓
Plagiarism Check
    ↓
Teacher Review
    ↓
Publishing
```

### Service Implementation

````python
# app/services/ai_pipeline.py
from typing import List
from app.models import GenerationRequest, GeneratedProblem, Problem
from app.tasks import generate_assignment_job
import httpx

class AIPipelineService:

    async def request_generation(
        self,
        teacher_id: int,
        concept: str,
        skill_level: str,
        language: str,
        count: int = 1,
    ) -> GenerationRequest:
        """Create generation request and enqueue job."""
        request = GenerationRequest(
            teacher_id=teacher_id,
            concept=concept,
            skill_level=skill_level,
            language=language,
            count=count,
            status="pending",
        )
        db.add(request)
        db.commit()

        # Enqueue generation job
        for i in range(count):
            generate_assignment_job.delay(request.id, i)

        return request

    async def generate_problem(self, request_id: int, index: int):
        """
        Generate a single problem.
        """
        request = db.query(GenerationRequest).get(request_id)

        # Step 1: Concept extraction
        concepts = self._extract_concepts(request.concept)

        # Step 2: Template retrieval
        template = self._retrieve_template(request.skill_level, concepts)

        # Step 3: Generate LLM prompt
        prompt = self._build_prompt(template, request)

        # Step 4: Call LLM
        llm_output = await self._call_llm(prompt)

        # Step 5: Parse output
        parsed = self._parse_llm_output(llm_output)

        # Create generated problem record
        gen_problem = GeneratedProblem(
            generation_request_id=request_id,
            prompt=prompt,
            raw_llm_output=llm_output,
            validation_status="pending",
        )
        db.add(gen_problem)
        db.commit()

        # Step 6: Generate hidden tests
        await self._generate_hidden_tests(gen_problem, parsed)

        # Step 7: Estimate difficulty
        difficulty = await self._estimate_difficulty(parsed)

        # Step 8: Sandbox verification
        verification = await self._verify_in_sandbox(gen_problem, parsed)

        # Step 9: Plagiarism check
        plagiarism_score = await self._check_plagiarism(parsed)

        # Update validation status
        if verification["success"] and plagiarism_score < 0.3:
            gen_problem.validation_status = "passed"
            gen_problem.plagiarism_score = plagiarism_score
        else:
            gen_problem.validation_status = "failed"
            gen_problem.validation_logs = json.dumps({
                "verification": verification,
                "plagiarism_score": plagiarism_score,
            })

        db.commit()

        # Publish event for teacher notification
        publish_event("generation.completed", {
            "generation_request_id": request_id,
            "generated_problem_id": gen_problem.id,
        })

    def _extract_concepts(self, concept: str) -> List[str]:
        """Extract related concepts from request."""
        # Simple keyword extraction; could use NLP
        return concept.lower().split()

    def _retrieve_template(self, skill_level: str, concepts: List[str]) -> str:
        """Retrieve problem template based on skill + concepts."""
        templates = {
            ("beginner", "recursion"): "Write a recursive function to...",
            ("intermediate", "recursion"): "Implement tail recursion for...",
            # ... many more
        }
        key = (skill_level, concepts[0] if concepts else "general")
        return templates.get(key, "Write a {skill_level} problem about {concept}.")

    def _build_prompt(self, template: str, request: GenerationRequest) -> str:
        """Build LLM prompt."""
        return f"""
        You are an expert coding instructor generating a {request.skill_level} problem.

        Template: {template}
        Concept: {request.concept}
        Language: {request.language}

        Generate a problem with:
        1. Clear problem statement (2-3 sentences)
        2. Input specification (JSON format)
        3. Output specification (JSON format)
        4. 2-3 example test cases
        5. Solution code in {request.language}
        6. 3-5 hidden test cases

        Respond ONLY with valid JSON (no markdown, no preamble):
        {{
            "title": "...",
            "description": "...",
            "input_spec": "...",
            "output_spec": "...",
            "examples": [
                {{"input": ..., "output": ...}},
                ...
            ],
            "solution": "...",
            "hidden_tests": [
                {{"input": ..., "output": ...}},
                ...
            ]
        }}
        """

    async def _call_llm(self, prompt: str) -> str:
        """Call OpenAI API."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                json={
                    "model": "gpt-4",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                    "max_tokens": 2000,
                },
            )
            result = response.json()
            return result["choices"][0]["message"]["content"]

    def _parse_llm_output(self, output: str) -> dict:
        """Parse JSON response from LLM."""
        import json
        import re

        # Remove markdown code blocks if present
        output = re.sub(r"```json\n?|\n?```", "", output)

        try:
            return json.loads(output)
        except json.JSONDecodeError as e:
            raise ValueError(f"LLM output is not valid JSON: {e}")

    async def _generate_hidden_tests(self, gen_problem: GeneratedProblem, parsed: dict):
        """Extract hidden tests from parsed output."""
        for test in parsed.get("hidden_tests", []):
            # Store as TestCase with is_hidden=True
            pass

    async def _estimate_difficulty(self, parsed: dict) -> str:
        """Estimate problem difficulty."""
        # Could use heuristics: solution length, concept complexity, etc.
        return "medium"  # Placeholder

    async def _verify_in_sandbox(self, gen_problem: GeneratedProblem, parsed: dict) -> dict:
        """Verify solution works in sandbox."""
        # Run solution code against test cases
        # Return success/failure
        pass

    async def _check_plagiarism(self, parsed: dict) -> float:
        """Check against seed problems."""
        # Simple cosine similarity check
        # Return score 0.0 - 1.0
        pass

    async def approve_and_publish(self, generated_problem_id: int) -> Problem:
        """Teacher approves; create actual Problem."""
        gen_problem = db.query(GeneratedProblem).get(generated_problem_id)
        parsed = json.loads(gen_problem.raw_llm_output)

        # Create Problem
        problem = Problem(
            slug=self._generate_slug(parsed["title"]),
            title=parsed["title"],
            description=parsed["description"],
            difficulty="medium",  # From estimation
            is_published=True,
            created_by=gen_problem.generation_request.teacher_id,
        )
        db.add(problem)
        db.flush()

        # Create language implementation
        impl = ProblemImplementation(
            problem_id=problem.id,
            language=gen_problem.generation_request.language,
            solution_code=parsed["solution"],
        )
        db.add(impl)

        # Create test cases
        for example in parsed["examples"]:
            test = TestCase(
                problem_id=problem.id,
                input_json=json.dumps(example["input"]),
                expected_output_json=json.dumps(example["output"]),
                is_hidden=False,
            )
            db.add(test)

        for hidden in parsed.get("hidden_tests", []):
            test = TestCase(
                problem_id=problem.id,
                input_json=json.dumps(hidden["input"]),
                expected_output_json=json.dumps(hidden["output"]),
                is_hidden=True,
            )
            db.add(test)

        db.commit()

        gen_problem.problem_id = problem.id
        gen_problem.teacher_approved = True
        db.commit()

        return problem
````

---

## Security Considerations

### Authentication & Authorization

1. **JWT Tokens**
   - Issued on login, httpOnly cookies (frontend stores in cookie, not localStorage)
   - 15-minute expiration, 7-day refresh window
   - Signed with HS256, secret rotated quarterly

2. **Role-based access control**
   - RBAC middleware on all endpoints
   - Teachers can only modify their own classes
   - Students can only view/submit to assigned problems
   - Admins have full access

3. **API Key Security**
   - OpenAI API key stored in secrets manager (AWS Secrets Manager or Vault)
   - Never committed to version control
   - Rotated every 6 months

### Code Execution Security

1. **Docker Sandbox Isolation**
   - User code runs in ephemeral container
   - No network access
   - No filesystem write outside /tmp
   - Memory + CPU limits enforced
   - Container destroyed after execution

2. **Input Validation**
   - All user input validated with Pydantic schemas
   - Code size limited to 100KB
   - SQL injection prevented with parameterized queries

3. **Rate Limiting**
   - 10 submissions per minute per user
   - 100 requests per minute per IP
   - Redis-backed rate limiter

### Data Security

1. **Password Hashing**
   - bcrypt with salt (auto-generated)
   - Never store plaintext

2. **HTTPS Only**
   - Redirect HTTP to HTTPS
   - HSTS headers (1 year, include subdomains)

3. **CORS**
   - Only allow frontend origin
   - No credentials in cross-origin requests (frontend in same domain)

4. **CSRF Protection**
   - If using session cookies, include CSRF tokens
   - If using JWT in httpOnly cookies, no CSRF needed

### Compliance

1. **GDPR/Privacy**
   - Soft deletes for user data (deleted_at column)
   - Data export endpoint for users
   - PII not logged or cached unnecessarily

2. **Student Safety**
   - High school students: extra care
   - No public student profiles
   - No student-to-student messaging (yet)
   - Flag inappropriate submissions

---

## Scaling Considerations

### Phase 1: MVP (0-100 students)

- Single FastAPI server
- PostgreSQL on Supabase
- Redis on Upstash
- Celery workers on same server or separate small instance
- S3 for file storage
- Docker compose for local + single server deployment

### Phase 2: Growth (100-5K students)

- Multiple FastAPI instances behind load balancer (Nginx)
- PostgreSQL with read replicas
- Redis cluster
- Separate worker fleet (3-5 machines)
- Horizontal scaling via docker-compose or simple Nomad

### Phase 3: Scale (5K+ students)

- Kubernetes cluster (Argo CD for GitOps)
- PostgreSQL managed service (AWS RDS, Supabase)
- Redis cluster
- Autoscaling worker pools
- CDN for static assets
- Separate analytics database (ClickHouse) for historical data
- Message queue upgrade to RabbitMQ or Kafka

### Performance Optimizations

1. **Database**
   - Proper indexing (shown in schema)
   - Query optimization with EXPLAIN ANALYZE
   - Connection pooling (pgbouncer)
   - Read replicas for analytics queries

2. **Caching**
   - Cache problem data (rarely changes)
   - Cache user roles (checked on every request)
   - Cache class membership (checked frequently)
   - TTL: 1 hour for user data, 24 hours for problem data

3. **API Response**
   - Pagination for all list endpoints (default 20, max 100)
   - Lazy loading of related data
   - Field selection (allow clients to request only needed fields)
   - Gzip compression

4. **Job Queue**
   - Separate queue priorities (execution, ai_generation, analytics)
   - Dedicated worker pools per queue type
   - Monitoring + alerting on queue depth

---

## Folder Structure

```
duckling-backend/
├── README.md
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── requirements.txt
├── pyproject.toml
├── poetry.lock
│
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app initialization
│   ├── config.py               # Configuration, env vars
│   ├── dependencies.py         # Dependency injection
│   │
│   ├── models/                 # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── class_.py
│   │   ├── problem.py
│   │   ├── assignment.py
│   │   ├── submission.py
│   │   ├── trail.py
│   │   ├── ai.py               # AI-related models
│   │   └── analytics.py
│   │
│   ├── schemas/                # Pydantic request/response models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── class_.py
│   │   ├── problem.py
│   │   ├── assignment.py
│   │   ├── submission.py
│   │   ├── trail.py
│   │   ├── ai.py
│   │   └── analytics.py
│   │
│   ├── routes/                 # API route handlers
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── classes.py
│   │   ├── problems.py
│   │   ├── assignments.py
│   │   ├── submissions.py
│   │   ├── execution.py
│   │   ├── trails.py
│   │   ├── playground.py
│   │   ├── ai.py
│   │   └── analytics.py
│   │
│   ├── services/               # Business logic
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── class_.py
│   │   ├── problem.py
│   │   ├── assignment.py
│   │   ├── submission.py
│   │   ├── execution.py
│   │   ├── trail.py
│   │   ├── playground.py
│   │   ├── ai_pipeline.py
│   │   ├── analytics.py
│   │   └── notification.py
│   │
│   ├── tasks/                  # Celery tasks
│   │   ├── __init__.py
│   │   ├── execution.py
│   │   ├── ai_generation.py
│   │   ├── validation.py
│   │   └── analytics.py
│   │
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth.py             # JWT verification
│   │   ├── rate_limit.py
│   │   └── error_handler.py
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── db.py               # DB session management
│   │   ├── redis.py            # Redis client
│   │   ├── jwt.py              # JWT encoding/decoding
│   │   ├── events.py           # Event publishing
│   │   ├── slugify.py
│   │   └── logger.py
│   │
│   └── sandbox/                # Execution sandbox
│       ├── __init__.py
│       ├── executor.py         # Main executor script
│       ├── languages/
│       │   ├── python.py
│       │   ├── java.py
│       │   └── javascript.py
│       └── Dockerfile
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py             # Pytest fixtures
│   ├── test_auth.py
│   ├── test_problems.py
│   ├── test_submissions.py
│   ├── test_execution.py
│   ├── test_ai_pipeline.py
│   └── integration/
│       ├── test_end_to_end.py
│       └── test_submission_lifecycle.py
│
├── migrations/                 # Alembic database migrations
│   ├── versions/
│   └── env.py
│
├── cli/                        # Developer CLI
│   ├── __init__.py
│   ├── main.py                 # CLI entry point
│   ├── commands/
│   │   ├── __init__.py
│   │   ├── dev.py              # Development commands
│   │   ├── ai.py               # AI generation commands
│   │   ├── submit.py           # Submission commands
│   │   ├── sandbox.py          # Sandbox testing
│   │   └── analytics.py        # Analytics commands
│   └── utils.py
│
└── docs/
    ├── API.md
    ├── ARCHITECTURE.md
    ├── SETUP.md
    └── DEPLOYMENT.md
```

---

## Local Development Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose
- Node.js 18+ (for executor testing)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/duckling-platform/backend.git
cd duckling-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with local values
# DATABASE_URL=postgresql://user:password@localhost/duckling
# REDIS_URL=redis://localhost:6379
# OPENAI_API_KEY=sk-...

# Start local infrastructure
docker-compose up -d postgres redis

# Run migrations
alembic upgrade head

# Build executor Docker image
docker build -t duckling-executor:latest ./app/sandbox

# Start FastAPI server
uvicorn app.main:app --reload

# In another terminal, start Celery worker
celery -A app.tasks worker --loglevel=info

# Start CLI for testing
python -m cli.main --help
```

### Docker Compose File

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: duckling
      POSTGRES_PASSWORD: duckling
      POSTGRES_DB: duckling
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U duckling"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  postgres-admin:
    image: dpage/pgadmin4:latest
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@duckling.local
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

---

## Testing Strategy

### Unit Tests

```python
# tests/test_problems.py
import pytest
from app.models import Problem
from app.services.problem import ProblemService

@pytest.fixture
def db_session(monkeypatch):
    """In-memory SQLite for tests."""
    session = create_test_session()
    yield session
    session.rollback()

@pytest.fixture
def problem_service(db_session):
    return ProblemService(db_session)

def test_create_problem(problem_service):
    problem = problem_service.create(
        title="Two Sum",
        description="Find two numbers that add to target.",
        difficulty="easy",
    )
    assert problem.id is not None
    assert problem.title == "Two Sum"

def test_problem_slug_is_unique(problem_service):
    p1 = problem_service.create(title="Two Sum", difficulty="easy")
    with pytest.raises(IntegrityError):
        p2 = problem_service.create(title="Two Sum", difficulty="medium")
```

### Integration Tests

```python
# tests/integration/test_submission_lifecycle.py
@pytest.mark.asyncio
async def test_full_submission_flow(client, db_session):
    """Test: student submits → execution → completion."""
    # Create user
    user = create_test_user(db_session)
    token = create_jwt_token(user.id)

    # Create problem
    problem = create_test_problem(db_session)

    # Submit code
    response = await client.post(
        "/api/v1/submissions",
        json={
            "problem_id": problem.id,
            "language": "python",
            "code": "def solution(x): return x + 1",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    submission_id = response.json()["id"]

    # Wait for execution
    await asyncio.sleep(2)  # Give worker time to process

    # Check result
    response = await client.get(
        f"/api/v1/submissions/{submission_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "completed"
```

### Load Tests

```python
# tests/load/locustfile.py
from locust import HttpUser, task, between

class DucklingUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        response = self.client.post("/api/v1/auth/login", json={
            "email": "student@test.com",
            "password": "password",
        })
        self.token = response.json()["access_token"]

    @task(3)
    def view_problems(self):
        self.client.get(
            "/api/v1/problems",
            headers={"Authorization": f"Bearer {self.token}"},
        )

    @task(1)
    def submit_code(self):
        self.client.post(
            "/api/v1/submissions",
            json={
                "problem_id": 1,
                "language": "python",
                "code": "def f(): pass",
            },
            headers={"Authorization": f"Bearer {self.token}"},
        )

# Run: locust -f tests/load/locustfile.py -u 100 -r 10 --host=http://localhost:8000
```

---

## Docker Strategy

### Multi-stage Build

```dockerfile
# Dockerfile
FROM python:3.11-slim as builder

WORKDIR /app
RUN apt-get update && apt-get install -y build-essential
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.11-slim

WORKDIR /app
RUN useradd -m appuser

COPY --from=builder /root/.local /home/appuser/.local
COPY . .

ENV PATH=/home/appuser/.local/bin:$PATH
RUN chown -R appuser:appuser /app

USER appuser
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Production Docker Compose

```yaml
# docker-compose.prod.yml
version: "3.9"

services:
  api:
    image: duckling-api:${VERSION}
    environment:
      DATABASE_URL: postgresql://...
      REDIS_URL: redis://redis:6379
      ENVIRONMENT: production
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: "1"
          memory: 512M

  worker:
    image: duckling-api:${VERSION}
    command: celery -A app.tasks worker --loglevel=info --concurrency=4
    environment:
      DATABASE_URL: postgresql://...
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: "2"
          memory: 1G

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      restart_policy:
        condition: on-failure

  redis:
    image: redis:7-alpine
    deploy:
      restart_policy:
        condition: on-failure

volumes:
  postgres_data:
```

---

## Example API Payloads

### Register User

**Request**

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "alice@school.edu",
  "username": "alice",
  "password": "SecurePassword123!",
  "role": "student"
}
```

**Response (201)**

```json
{
  "id": 1,
  "email": "alice@school.edu",
  "username": "alice",
  "role": "student",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Login

**Request**

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "alice@school.edu",
  "password": "SecurePassword123!"
}
```

**Response (200)**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "alice@school.edu",
    "username": "alice",
    "role": "student"
  }
}
```

### Create Problem

**Request**

```http
POST /api/v1/problems
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Two Sum",
  "description": "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.",
  "difficulty": "easy",
  "category": "arrays",
  "estimated_time_minutes": 15
}
```

**Response (201)**

```json
{
  "id": 42,
  "slug": "two-sum",
  "title": "Two Sum",
  "description": "Given an array...",
  "difficulty": "easy",
  "category": "arrays",
  "is_published": false,
  "created_by": 2,
  "created_at": "2024-01-15T11:00:00Z"
}
```

### Add Problem Implementation

**Request**

```http
POST /api/v1/problems/42/implementations/python
Authorization: Bearer {token}
Content-Type: application/json

{
  "skeleton_code": "def twoSum(nums, target):\n    pass",
  "solution_code": "def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        if target - num in seen:\n            return [seen[target - num], i]\n        seen[num] = i"
}
```

**Response (201)**

```json
{
  "id": 1,
  "problem_id": 42,
  "language": "python",
  "skeleton_code": "def twoSum(nums, target):\n    pass",
  "created_at": "2024-01-15T11:05:00Z"
}
```

### Create Test Case

**Request**

```http
POST /api/v1/problems/42/test-cases
Authorization: Bearer {token}
Content-Type: application/json

{
  "input_json": {"nums": [2, 7, 11, 15], "target": 9},
  "expected_output_json": [0, 1],
  "is_hidden": false
}
```

**Response (201)**

```json
{
  "id": 1,
  "problem_id": 42,
  "input_json": { "nums": [2, 7, 11, 15], "target": 9 },
  "expected_output_json": [0, 1],
  "is_hidden": false,
  "created_at": "2024-01-15T11:10:00Z"
}
```

### Create Class

**Request**

```http
POST /api/v1/classes
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "AP Computer Science Principles",
  "description": "Introduction to computer science for high school students.",
  "language_focus": "python"
}
```

**Response (201)**

```json
{
  "id": 1,
  "teacher_id": 2,
  "name": "AP Computer Science Principles",
  "code": "xB7kQ2",
  "language_focus": "python",
  "is_active": true,
  "created_at": "2024-01-15T11:15:00Z"
}
```

### Join Class

**Request**

```http
POST /api/v1/classes/1/join
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "xB7kQ2"
}
```

**Response (200)**

```json
{
  "class_id": 1,
  "student_id": 1,
  "enrolled_at": "2024-01-15T11:20:00Z"
}
```

### Create Assignment

**Request**

```http
POST /api/v1/assignments
Authorization: Bearer {token}
Content-Type: application/json

{
  "class_id": 1,
  "problem_id": 42,
  "title": "Practice: Two Sum",
  "instructions": "Solve this problem using a hash map for O(n) time complexity.",
  "due_at": "2024-01-22T23:59:59Z"
}
```

**Response (201)**

```json
{
  "id": 1,
  "class_id": 1,
  "problem_id": 42,
  "title": "Practice: Two Sum",
  "due_at": "2024-01-22T23:59:59Z",
  "created_by": 2,
  "created_at": "2024-01-15T11:25:00Z"
}
```

### Submit Code

**Request**

```http
POST /api/v1/submissions
Authorization: Bearer {token}
Content-Type: application/json

{
  "problem_id": 42,
  "assignment_id": 1,
  "language": "python",
  "code": "def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        if target - num in seen:\n            return [seen[target - num], i]\n        seen[num] = i\n    return []"
}
```

**Response (201)**

```json
{
  "id": 100,
  "student_id": 1,
  "problem_id": 42,
  "assignment_id": 1,
  "language": "python",
  "submission_type": "homework",
  "status": "queued",
  "job_id": "task-uuid-12345",
  "submitted_at": "2024-01-15T11:30:00Z"
}
```

### Poll Submission Result

**Request**

```http
GET /api/v1/submissions/100
Authorization: Bearer {token}
```

**Response (200) - Still running**

```json
{
  "id": 100,
  "status": "running",
  "result": null
}
```

**Response (200) - Completed**

```json
{
  "id": 100,
  "student_id": 1,
  "problem_id": 42,
  "status": "completed",
  "result": "passed",
  "passed_tests": 5,
  "total_tests": 5,
  "execution_time_ms": 45,
  "output_json": {
    "test_results": [
      {
        "input": {"nums": [2, 7, 11, 15], "target": 9},
        "expected": [0, 1],
        "actual": [0, 1],
        "passed": true
      },
      ...
    ]
  },
  "completed_at": "2024-01-15T11:30:10Z"
}
```

### Request AI Generation

**Request**

```http
POST /api/v1/ai/generate-assignments
Authorization: Bearer {token}
Content-Type: application/json

{
  "concept": "recursion",
  "skill_level": "intermediate",
  "language": "python",
  "count": 3
}
```

**Response (201)**

```json
{
  "id": 1,
  "teacher_id": 2,
  "concept": "recursion",
  "skill_level": "intermediate",
  "language": "python",
  "count": 3,
  "status": "generating",
  "created_at": "2024-01-15T11:35:00Z"
}
```

### Get Generation Status

**Request**

```http
GET /api/v1/ai/generation-requests/1
Authorization: Bearer {token}
```

**Response (200)**

```json
{
  "id": 1,
  "status": "completed",
  "generated_problems": [
    {
      "id": 1,
      "prompt": "Generate a recursion problem...",
      "validation_status": "passed",
      "plagiarism_score": 0.15,
      "teacher_approved": false
    },
    ...
  ]
}
```

### Get Analytics

**Request**

```http
GET /api/v1/analytics/me/summary
Authorization: Bearer {token}
```

**Response (200)**

```json
{
  "student_id": 1,
  "problems_attempted": 12,
  "problems_solved": 8,
  "success_rate": 0.67,
  "total_submissions": 24,
  "recent_submissions": [
    {
      "submission_id": 100,
      "problem_id": 42,
      "status": "passed",
      "submitted_at": "2024-01-15T11:30:00Z"
    },
    ...
  ],
  "trails": [
    {
      "trail_id": 1,
      "name": "Python Fundamentals",
      "progress": 0.45,
      "completed_milestones": 9,
      "total_milestones": 20
    },
    ...
  ]
}
```

---

## Example Execution Flows

### Submission Execution Flow

```
1. Student submits code via API
   POST /api/v1/submissions
   {problem_id, language, code, assignment_id}

2. FastAPI route receives request
   - Validates JWT token
   - Validates input (code size, language, problem exists)
   - Creates Submission record (status='draft')
   - Saves code to S3

3. Enqueue execution job
   - Call Celery task: execute_submission.delay(submission_id)
   - Update submission status to 'queued'
   - Return submission record with job_id

4. Worker picks up job from queue
   - Fetch submission details
   - Fetch problem + test cases
   - Pull visible test cases (is_hidden=false)

5. Prepare Docker execution
   - Create temp directory
   - Write code to file
   - Prepare executor script
   - Create Docker container

6. Execute in sandbox
   - Pass code + test cases to executor
   - Execute with 30s timeout
   - Capture stdout, stderr, exit code

7. Parse results
   - Compare actual output vs expected output
   - Count passed/failed tests
   - Calculate execution time

8. Update submission record
   - status='completed'
   - result='passed' or 'failed'
   - passed_tests=X/Y
   - output_json={test results}

9. Publish event
   - Event: 'submission.completed'
   - Subscribers: WebSocket, analytics, notifications

10. Return to student
    - WebSocket message to client
    - Student sees results in real-time
```

### AI Generation Flow

```
1. Teacher requests generation
   POST /api/v1/ai/generate-assignments
   {concept, skill_level, language, count}

2. Create GenerationRequest record
   - status='pending'
   - Enqueue ai_generation.delay(request_id)

3. Worker: Concept extraction
   - Parse concept keywords
   - Query problem bank for related problems

4. Worker: Template retrieval
   - Match skill_level + concepts to templates
   - Get problem structure template

5. Worker: Build LLM prompt
   - Inject template, skill level, language
   - Add examples of good problems
   - Ask for JSON output format

6. Worker: Call OpenAI API
   - POST to gpt-4-turbo
   - Pass prompt + context
   - Get JSON response

7. Worker: Parse output
   - Extract JSON from response
   - Validate structure
   - Extract title, description, solution, tests

8. Create GeneratedProblem record
   - status='pending'
   - raw_llm_output stored
   - Enqueue validation job

9. Worker: Validation
   a) Sandbox verification
      - Run solution against test cases
      - Confirm correctness

   b) Difficulty estimation
      - Analyze solution complexity
      - Estimate time needed

   c) Plagiarism check
      - Compare against seed problems
      - Cosine similarity score

10. Update GeneratedProblem
    - validation_status='passed' or 'failed'
    - plagiarism_score stored

11. Publish event
    - Event: 'generation.completed'
    - Teacher gets notification

12. Teacher reviews
    - Can approve (creates Problem + tests)
    - Can reject (stays as generated, not published)

13. If approved: Publish
    - Create Problem record
    - Create ProblemImplementation
    - Create TestCases
    - Link GeneratedProblem to Problem
```

---

## Example Assignment Generation

### Scenario: Teacher generates 3 recursion problems

**Step 1: Request**

```bash
curl -X POST http://localhost:8000/api/v1/ai/generate-assignments \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "concept": "recursion",
    "skill_level": "intermediate",
    "language": "python",
    "count": 3
  }'
```

**Step 2: Database State**

```sql
-- ai_generation_requests
INSERT INTO ai_generation_requests
  (teacher_id, concept, skill_level, language, count, status)
VALUES (2, 'recursion', 'intermediate', 'python', 3, 'pending')
RETURNING id;  -- id=1

-- Enqueued 3 jobs to Celery
celery_task: generate_problem.delay(request_id=1, index=0)
celery_task: generate_problem.delay(request_id=1, index=1)
celery_task: generate_problem.delay(request_id=1, index=2)
```

**Step 3: Worker processes job 0**

```python
# Concept extraction
concepts = ['recursion', 'tail-recursion', 'base-case']

# Template retrieval
template = """
Write a recursive function that {concept}.
- Input: {{input_spec}}
- Output: {{output_spec}}
- Constraints: time O(n), space O(1) iterative or O(n) recursive
"""

# Build LLM prompt
prompt = """
You are an expert coding instructor generating a recursion problem for intermediate students.

Template:
Write a recursive function that solves a classic recursion problem.

Concept: recursion, tail-recursion, base-case
Language: python

Generate a problem with:
1. Clear problem statement (2-3 sentences)
2. Input specification (JSON format)
3. Output specification (JSON format)
4. 2-3 example test cases
5. Solution code in python
6. 3-5 hidden test cases

Respond ONLY with valid JSON (no markdown, no preamble):
{
    "title": "...",
    "description": "...",
    ...
}
"""

# Call LLM
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": prompt}],
)

# Raw output
raw_output = """
{
    "title": "Climb Stairs",
    "description": "You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    "input_spec": "An integer n representing number of steps (1 <= n <= 45)",
    "output_spec": "An integer representing the number of distinct ways",
    "examples": [
        {
            "input": {"n": 2},
            "output": 2
        },
        {
            "input": {"n": 3},
            "output": 3
        }
    ],
    "solution": "def climbStairs(n):\\n    if n <= 1:\\n        return 1\\n    if n == 2:\\n        return 2\\n    return climbStairs(n-1) + climbStairs(n-2)",
    "hidden_tests": [
        {"input": {"n": 1}, "output": 1},
        {"input": {"n": 4}, "output": 5},
        {"input": {"n": 5}, "output": 8}
    ]
}
"""

# Parse & create GeneratedProblem
gen_problem = GeneratedProblem(
    generation_request_id=1,
    prompt=prompt,
    raw_llm_output=raw_output,
    validation_status='pending'
)
db.add(gen_problem)
db.commit()  # id=1

# Enqueue validation job
validate_generated_problem.delay(gen_problem_id=1)
```

**Step 4: Validation worker**

```python
# Sandbox verification
solution = "def climbStairs(n):\\n    if n <= 1:\\n        return 1\\n    if n == 2:\\n        return 2\\n    return climbStairs(n-1) + climbStairs(n-2)"

# Test against hidden tests
tests = [
    {"input": {"n": 1}, "expected": 1},
    {"input": {"n": 4}, "expected": 5},
]

# Execute in sandbox
results = [
    {"input": 1, "output": 1, "passed": True},
    {"input": 4, "output": 5, "passed": True},
]

# Plagiarism check
comparison_problems = [
    # ... seed problems from problem bank
]
similarity_score = cosine_similarity(
    solution,
    [p.solution for p in comparison_problems]
)  # 0.45 (not plagiarized)

# Update record
gen_problem.validation_status = 'passed'
gen_problem.plagiarism_score = 0.45
db.commit()

# Publish event
publish_event('validation.passed', {
    'generated_problem_id': 1,
    'plagiarism_score': 0.45
})
```

**Step 5: Teacher review**

```bash
# Get generated problem for review
curl http://localhost:8000/api/v1/ai/generated-problems/1 \
  -H "Authorization: Bearer {token}"

# Response
{
  "id": 1,
  "title": "Climb Stairs",
  "description": "You are climbing a staircase...",
  "validation_status": "passed",
  "plagiarism_score": 0.45,
  "teacher_approved": false,
  "prompt": "You are an expert..."
}
```

**Step 6: Teacher approves**

```bash
curl -X PATCH http://localhost:8000/api/v1/ai/generated-problems/1/approve \
  -H "Authorization: Bearer {token}"
```

**Step 7: Publishing**

```python
# Create Problem
problem = Problem(
    slug='climb-stairs',
    title='Climb Stairs',
    description='You are climbing a staircase...',
    difficulty='intermediate',
    is_published=True,
    created_by=2,  # teacher
)
db.add(problem)
db.flush()  # id=43

# Create implementation
impl = ProblemImplementation(
    problem_id=43,
    language='python',
    solution_code='def climbStairs(n):\n    ...',
)
db.add(impl)

# Create test cases
for example in examples:
    test = TestCase(
        problem_id=43,
        input_json=json.dumps(example['input']),
        expected_output_json=json.dumps(example['output']),
        is_hidden=False
    )
    db.add(test)

for hidden in hidden_tests:
    test = TestCase(
        problem_id=43,
        input_json=json.dumps(hidden['input']),
        expected_output_json=json.dumps(hidden['output']),
        is_hidden=True
    )
    db.add(test)

db.commit()

# Link to generation record
gen_problem.problem_id = 43
gen_problem.teacher_approved = True
db.commit()

# Publish event
publish_event('problem.published', {
    'problem_id': 43,
    'generated_from': 1,
})
```

**Result**: Teacher now has 3 generated, validated, published problems ready to assign to class.

---

## Submission Lifecycle

### Complete lifecycle with state diagram

```
┌─────────────┐
│   Draft     │  (User writing code)
└──────┬──────┘
       │ [submit]
       ▼
┌─────────────┐
│   Queued    │  (Waiting for worker)
└──────┬──────┘
       │ [worker picks up]
       ▼
┌─────────────┐
│  Running    │  (Code executing in sandbox)
└──────┬──────┘
       │
       ├─ [all tests pass]
       │  ▼
       │  ┌──────────────┐
       │  │   Completed  │──► Result: PASSED
       │  │   (Passed)   │
       │  └──────────────┘
       │
       ├─ [some tests fail]
       │  ▼
       │  ┌──────────────┐
       │  │   Completed  │──► Result: FAILED
       │  │   (Failed)   │
       │  └──────────────┘
       │
       ├─ [timeout (>30s)]
       │  ▼
       │  ┌──────────────┐
       │  │   Completed  │──► Result: TIMEOUT
       │  │   (Error)    │
       │  └──────────────┘
       │
       └─ [runtime error]
          ▼
          ┌──────────────┐
          │   Completed  │──► Result: RUNTIME_ERROR
          │   (Error)    │
          └──────────────┘
```

### Database state transitions

```sql
-- State 1: User submits
INSERT INTO submissions
  (student_id, problem_id, assignment_id, language, code, status, submission_type)
VALUES (1, 42, 1, 'python', 'def f(): pass', 'draft', 'homework')
RETURNING id;  -- id=100

-- State 2: API enqueues job
UPDATE submissions SET status='queued', job_id='celery-uuid' WHERE id=100;
INSERT INTO execution_jobs (submission_id, job_id, status)
VALUES (100, 'celery-uuid', 'queued');

-- State 3: Worker starts
UPDATE execution_jobs SET status='running', worker_id='worker-1' WHERE job_id='celery-uuid';

-- State 4a: Success path
UPDATE submissions SET
  status='completed',
  result='passed',
  passed_tests=5,
  total_tests=5,
  execution_time_ms=45,
  output_json='{"test_results": [...]}',
  completed_at=NOW()
WHERE id=100;

UPDATE execution_jobs SET status='completed' WHERE job_id='celery-uuid';

-- Publish event
NOTIFY "submission.completed", '{"submission_id": 100, "result": "passed"}';

-- State 4b: Failure path
UPDATE submissions SET
  status='completed',
  result='failed',
  passed_tests=2,
  total_tests=5,
  error_message='Test case 3 failed',
  completed_at=NOW()
WHERE id=100;

-- Both paths trigger event → WebSocket → frontend real-time update
```

---

## Observability & Logging

### Structured Logging

```python
# app/utils/logger.py
import json
import logging
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add extra context if present
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        if hasattr(record, 'submission_id'):
            log_data['submission_id'] = record.submission_id
        if hasattr(record, 'trace_id'):
            log_data['trace_id'] = record.trace_id

        # Add exception info
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)

        return json.dumps(log_data)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    handlers=[
        logging.StreamHandler(),
    ],
    format='%(message)s',
)

# Use context logging in services
logger = logging.getLogger(__name__)

def submit_code(submission_id: int):
    logger.info(
        "Submission received",
        extra={
            "submission_id": submission_id,
            "user_id": current_user.id,
            "trace_id": request.headers.get('X-Trace-ID'),
        }
    )
```

### Metrics & Monitoring

```python
# app/utils/metrics.py
from prometheus_client import Counter, Histogram, Gauge

# Counters
submissions_total = Counter(
    'submissions_total',
    'Total submissions',
    ['language', 'status', 'result']
)

# Histograms
submission_duration_ms = Histogram(
    'submission_duration_ms',
    'Submission execution time',
    buckets=[10, 50, 100, 500, 1000, 5000]
)

# Gauges
queue_depth = Gauge(
    'execution_queue_depth',
    'Number of jobs waiting'
)

# Usage in code
submissions_total.labels(
    language='python',
    status='completed',
    result='passed'
).inc()

submission_duration_ms.observe(execution_time_ms)
```

### Error Tracking (Sentry)

```python
# app/config.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
    environment=os.getenv('ENVIRONMENT', 'development'),
)

# Sentry automatically captures:
# - Unhandled exceptions
# - HTTP errors (5xx)
# - Performance monitoring
# - Release tracking

# Custom events
sentry_sdk.capture_message(
    "Plagiarism score high",
    level="warning",
    extra={"plagiarism_score": 0.95}
)
```

### Health Checks

```python
# app/routes/health.py
@router.get("/health")
async def health_check():
    """Liveness probe."""
    return {"status": "ok"}

@router.get("/health/ready")
async def readiness_check():
    """Readiness probe."""
    try:
        # Check database
        db.execute("SELECT 1")

        # Check Redis
        redis.ping()

        # Check Celery workers
        inspect = Inspect()
        stats = inspect.stats()
        if not stats:
            return {"status": "not_ready", "reason": "no_workers"}, 503

        return {"status": "ready"}
    except Exception as e:
        return {
            "status": "not_ready",
            "reason": str(e)
        }, 503
```

---

## Deployment Architecture

### Development (Local)

```
Developer laptop
├── FastAPI server (uvicorn, reload)
├── PostgreSQL (Docker)
├── Redis (Docker)
└── Celery worker (local)
```

### Staging (AWS)

```
Load Balancer (ALB)
├── EC2 x2 (FastAPI)
├── EC2 x2 (Celery workers)
├── RDS PostgreSQL (Multi-AZ)
├── ElastiCache Redis
└── S3 (code storage)
```

### Production (AWS)

```
CloudFront (CDN)
    ↓
Load Balancer (ALB)
    ├─ ASG (FastAPI x3-10)
    ├─ ASG (Celery Workers x5-20)
    ├─ RDS PostgreSQL (Multi-AZ, read replicas)
    ├─ ElastiCache Redis (cluster mode)
    ├─ S3 + CloudFront
    ├─ CloudWatch (logging, metrics)
    └─ Sentry (error tracking)
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: "3.11"
      - run: pip install -r requirements.txt
      - run: pytest tests/
      - run: mypy app/
      - run: black --check app/

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - uses: docker/build-push-action@v4
        with:
          push: true
          tags: ${{ secrets.ECR_REGISTRY }}/duckling-api:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v1
        with:
          role-to-assume: arn:aws:iam::...
      - run: aws ecs update-service --cluster duckling-prod --service api --force-new-deployment
```

---

## Developer CLI Specification

The CLI provides rapid development & testing workflows.

### CLI Structure

```
duck                          # Main command
├── dev                       # Development commands
│   ├── create-user
│   ├── create-class
│   ├── create-problem
│   ├── seed-data
│   └── reset-db
├── ai                        # AI generation
│   ├── generate-assignment
│   ├── validate-generated
│   └── list-generated
├── submit                    # Submission testing
│   ├── run                   # Execute submission
│   └── list
├── sandbox                   # Sandbox testing
│   ├── test
│   └── benchmark
├── analytics                 # Analytics
│   ├── student-stats
│   ├── class-stats
│   └── problem-difficulty
└── queue                     # Queue inspection
    ├── status
    ├── clear
    └── inspect
```

### Implementation

```python
# cli/main.py
import click
from click_help_colors import HelpColorsGroup

@click.group(
    cls=HelpColorsGroup,
    help_options_color='cyan',
    help_headers_color='yellow'
)
@click.version_option()
def cli():
    """Duckling Backend CLI - Development & Testing"""
    pass

# Commands
cli.add_command(dev.cmd_dev)
cli.add_command(ai.cmd_ai)
cli.add_command(submit.cmd_submit)
cli.add_command(sandbox.cmd_sandbox)
cli.add_command(analytics.cmd_analytics)
cli.add_command(queue.cmd_queue)

if __name__ == '__main__':
    cli()
```

### Development Commands

```python
# cli/commands/dev.py
import click
from faker import Faker
from app.models import *
from app.db import get_session

fake = Faker()

@click.group('dev')
def cmd_dev():
    """Development utilities"""
    pass

@cmd_dev.command()
@click.option('--email', prompt=True)
@click.option('--username', prompt=True)
@click.option('--role', type=click.Choice(['student', 'teacher']), default='student')
def create_user(email, username, role):
    """Create test user"""
    from app.services.auth import AuthService
    session = get_session()

    auth = AuthService(session)
    user = auth.register(email, username, 'password123', role)

    click.secho(f'✓ User created: {user.id}', fg='green')
    click.echo(f'  Email: {user.email}')
    click.echo(f'  Role: {user.role}')

@cmd_dev.command()
@click.option('--teacher-id', type=int, prompt=True)
@click.option('--name', prompt=True)
@click.option('--language', default='python')
def create_class(teacher_id, name, language):
    """Create class"""
    from app.services.class_ import ClassService
    session = get_session()

    service = ClassService(session)
    cls = service.create(
        teacher_id=teacher_id,
        name=name,
        language_focus=language
    )

    click.secho(f'✓ Class created: {cls.id}', fg='green')
    click.echo(f'  Code: {cls.code}')
    click.echo(f'  Name: {cls.name}')

@cmd_dev.command()
def seed_data():
    """Create realistic test data"""
    session = get_session()

    # Create 5 teachers
    teachers = []
    for i in range(5):
        user = User(
            email=f'teacher{i}@school.edu',
            username=f'teacher{i}',
            password_hash='...',
            role='teacher'
        )
        session.add(user)
        teachers.append(user)
    session.flush()

    # Create 50 students
    students = []
    for i in range(50):
        user = User(
            email=f'student{i}@school.edu',
            username=f'student{i}',
            password_hash='...',
            role='student'
        )
        session.add(user)
        students.append(user)
    session.flush()

    # Create classes
    for i, teacher in enumerate(teachers):
        cls = Class(
            teacher_id=teacher.id,
            name=f'AP CS {i+1}',
            language_focus='python'
        )
        session.add(cls)
        session.flush()

        # Enroll students
        for student in students[i*10:(i+1)*10]:
            enrollment = Enrollment(
                class_id=cls.id,
                student_id=student.id
            )
            session.add(enrollment)

    session.commit()
    click.secho(f'✓ Seeded {len(teachers)} teachers, {len(students)} students', fg='green')

@cmd_dev.command()
def reset_db():
    """Drop and recreate database"""
    if click.confirm('Drop ALL data?', default=False):
        from alembic.config import Config
        from alembic.script import ScriptDirectory
        from alembic.runtime.migration import MigrationContext

        alembic_cfg = Config('alembic.ini')
        script = ScriptDirectory.from_config(alembic_cfg)

        # Drop all
        Base.metadata.drop_all(bind=engine)

        # Recreate
        Base.metadata.create_all(bind=engine)

        # Run migrations
        os.system('alembic upgrade head')

        click.secho('✓ Database reset', fg='green')
```

### AI Commands

```python
# cli/commands/ai.py
import click
import asyncio

@click.group('ai')
def cmd_ai():
    """AI generation utilities"""
    pass

@cmd_ai.command()
@click.option('--teacher-id', type=int, prompt=True)
@click.option('--concept', prompt=True)
@click.option('--skill-level', type=click.Choice(['beginner', 'intermediate', 'advanced']), default='intermediate')
@click.option('--language', default='python')
@click.option('--count', type=int, default=1)
def generate_assignment(teacher_id, concept, skill_level, language, count):
    """Generate AI problems"""
    from app.services.ai_pipeline import AIPipelineService
    session = get_session()

    service = AIPipelineService(session)

    with click.progressbar(length=count, label='Generating') as bar:
        req = asyncio.run(service.request_generation(
            teacher_id=teacher_id,
            concept=concept,
            skill_level=skill_level,
            language=language,
            count=count
        ))

        # Wait for completion
        for _ in range(120):  # Wait up to 2 minutes
            session.refresh(req)
            if req.status == 'completed':
                break
            time.sleep(1)
            bar.update(1)

    click.secho(f'✓ Generated {count} problems', fg='green')
    click.echo(f'  Request ID: {req.id}')
    click.echo(f'  Status: {req.status}')

    # List generated problems
    generated = session.query(GeneratedProblem).filter_by(
        generation_request_id=req.id
    ).all()

    for gen in generated:
        status_color = 'green' if gen.validation_status == 'passed' else 'yellow'
        click.secho(f'  [{gen.id}] {status_color}{gen.validation_status}{" " * (10-len(gen.validation_status))}', fg=status_color)

@cmd_ai.command()
@cmd_ai.option('--request-id', type=int, prompt=True)
def list_generated(request_id):
    """List generated problems from request"""
    session = get_session()

    generated = session.query(GeneratedProblem).filter_by(
        generation_request_id=request_id
    ).all()

    click.echo(f'Generated problems for request {request_id}:\n')

    for gen in generated:
        parsed = json.loads(gen.raw_llm_output)
        status_color = 'green' if gen.validation_status == 'passed' else 'red'

        click.echo(f'  ID: {gen.id}')
        click.echo(f'  Title: {parsed["title"]}')
        click.secho(f'  Validation: {gen.validation_status}', fg=status_color)
        click.echo(f'  Plagiarism: {gen.plagiarism_score or "N/A"}')
        click.echo()
```

### Submission Commands

```python
# cli/commands/submit.py
import click
import json

@click.group('submit')
def cmd_submit():
    """Submission testing"""
    pass

@cmd_submit.command()
@click.option('--student-id', type=int, prompt=True)
@click.option('--problem-id', type=int, prompt=True)
@click.option('--language', default='python')
@click.option('--code-file', type=click.File('r'))
def run(student_id, problem_id, language, code_file):
    """Run a submission"""
    from app.services.submission import SubmissionService
    from app.services.execution import ExecutionService
    session = get_session()

    # Get code
    if code_file:
        code = code_file.read()
    else:
        code = click.prompt(f'Paste {language} code (Ctrl-D to end)', hide=False)

    # Create submission
    sub_service = SubmissionService(session)
    submission = sub_service.create(
        student_id=student_id,
        problem_id=problem_id,
        language=language,
        code=code
    )
    click.echo(f'Submission created: {submission.id}')

    # Execute
    exec_service = ExecutionService(session)
    result = asyncio.run(exec_service.execute(submission.id))

    # Display results
    click.echo()
    click.secho(f'Result: {result["result"]}', fg='green' if result["result"] == 'passed' else 'red')
    click.echo(f'Passed: {result["passed_tests"]}/{result["total_tests"]}')

    if result.get('output_json'):
        click.echo(f'\nTest Details:')
        for test in result['output_json']['test_results']:
            status = '✓' if test['passed'] else '✗'
            click.echo(f'  {status} Input: {test["input"]}')
            if not test['passed']:
                click.echo(f'    Expected: {test["expected"]}')
                click.echo(f'    Got: {test["actual"]}')

@cmd_submit.command()
@click.option('--student-id', type=int)
@click.option('--limit', type=int, default=10)
def list(student_id, limit):
    """List recent submissions"""
    session = get_session()

    query = session.query(Submission)
    if student_id:
        query = query.filter(Submission.student_id == student_id)

    submissions = query.order_by(Submission.created_at.desc()).limit(limit).all()

    click.echo(f'Recent submissions:\n')
    for sub in submissions:
        result_color = 'green' if sub.result == 'passed' else 'red'
        click.echo(f'[{sub.id:5d}] {sub.problem.title:30s} {sub.status:10s}', nl=False)
        click.secho(f'  {sub.result or "—"}', fg=result_color)
```

### Queue Commands

```python
# cli/commands/queue.py
import click
from celery.app.control import Inspect

@click.group('queue')
def cmd_queue():
    """Queue management"""
    pass

@cmd_queue.command()
def status():
    """Show queue status"""
    from celery import Celery
    app = Celery('app')
    app.config_from_object('app.config:CELERY_CONFIG')

    inspect = Inspect(app=app)

    # Active jobs
    active = inspect.active()
    if active:
        click.secho('Active Jobs:', bold=True)
        for worker, tasks in active.items():
            click.echo(f'  {worker}: {len(tasks)} tasks')
            for task in tasks[:3]:
                click.echo(f'    - {task["name"]}')
            if len(tasks) > 3:
                click.echo(f'    ... and {len(tasks) - 3} more')

    # Registered tasks
    registered = inspect.registered()
    if registered:
        click.echo()
        click.secho('Registered Tasks:', bold=True)
        for worker, tasks in registered.items():
            click.echo(f'  {worker}: {len(tasks)} tasks')

    # Stats
    stats = inspect.stats()
    if stats:
        click.echo()
        click.secho('Worker Stats:', bold=True)
        for worker, info in stats.items():
            click.echo(f'  {worker}')
            click.echo(f'    Processed: {info.get("total", 0)}')
            click.echo(f'    Pool: {info.get("pool", {}).get("implementation", "unknown")}')

@cmd_queue.command()
def clear():
    """Clear all pending jobs"""
    if click.confirm('Clear ALL pending jobs?', default=False):
        from celery import Celery
        app = Celery('app')
        app.config_from_object('app.config:CELERY_CONFIG')

        app.control.purge()
        click.secho('✓ Queue cleared', fg='green')
```

---

## Example CLI Workflow

Complete realistic workflow demonstrating the entire backend:

```bash
# ============================================================
# 1. Start local infrastructure
# ============================================================

$ docker-compose up -d
Creating postgres ... done
Creating redis ... done
Starting services...

$ docker-compose ps
NAME           STATUS
postgres       Up 2 seconds (healthy)
redis          Up 2 seconds (healthy)

# ============================================================
# 2. Initialize database and seed data
# ============================================================

$ alembic upgrade head
INFO: Running upgrade ba266b8ed50d
INFO: Finished upgrade head

$ duck dev:seed-data
Creating users...
✓ Seeded 5 teachers, 50 students

# ============================================================
# 3. Verify database state
# ============================================================

$ psql postgresql://duckling:duckling@localhost/duckling
duckling=# SELECT count(*) FROM users;
 count
-------
    55
(1 row)

duckling=# SELECT * FROM users LIMIT 2;
 id |      email       | username |      role      |    created_at
----+------------------+----------+----------------+------------------
  1 | teacher0@... | teacher0 | teacher        | 2024-01-15 12:00:00
  2 | student0@... | student0 | student        | 2024-01-15 12:00:00

# ============================================================
# 4. Create users manually
# ============================================================

$ duck dev:create-user
Email: alice@school.edu
Username: alice
Role: [student]:
✓ User created: 56
  Email: alice@school.edu
  Role: student

$ duck dev:create-user
Email: bob@school.edu
Username: bob
Role: teacher
✓ User created: 57
  Email: bob@school.edu
  Role: teacher

# ============================================================
# 5. Create class
# ============================================================

$ duck dev:create-class
Teacher ID: 57
Name: AP Computer Science Principles
Language: python
✓ Class created: 1
  Code: xB7kQ2
  Name: AP Computer Science Principles

# ============================================================
# 6. Create problem
# ============================================================

$ duck dev:create-problem
Title: Two Sum
Description: Find two numbers in array that add to target
Difficulty: easy
Language: python
✓ Problem created: 1
  Slug: two-sum

# ============================================================
# 7. Add test cases
# ============================================================

$ duck problem:add-test-case 1
Input (JSON): {"nums": [2, 7, 11, 15], "target": 9}
Expected Output: [0, 1]
Is Hidden? [y/N]: N
✓ Test case added

$ duck problem:add-test-case 1
Input (JSON): {"nums": [3, 2, 4], "target": 6}
Expected Output: [1, 2]
Is Hidden? [y/N]: N
✓ Test case added

$ duck problem:add-test-case 1
Input (JSON): {"nums": [1, 5, 10, 2], "target": 7}
Expected Output: [0, 3]
Is Hidden? [y/N]: y
✓ Test case added (hidden)

# ============================================================
# 8. Create assignment
# ============================================================

$ duck dev:create-assignment
Class ID: 1
Problem ID: 1
Title: Homework: Two Sum
Due Date (optional): 2024-01-22T23:59:59Z
✓ Assignment created: 1

# ============================================================
# 9. Start API server
# ============================================================

$ uvicorn app.main:app --reload --port 8000
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

```bash
# ============================================================
# 10. In another terminal: Start Celery worker
# ============================================================

$ celery -A app.tasks worker --loglevel=info
 ---------- celery@alice worker connected ----------
[Tasks]
  . app.tasks.execution.execute_submission
  . app.tasks.ai_generation.generate_problem
  . app.tasks.validation.validate_generated_problem
  . app.tasks.analytics.compute_class_stats

 [*] Waiting for tasks...
```

```bash
# ============================================================
# 11. Student submits homework code
# ============================================================

$ duck submit:run
Student ID: 56
Problem ID: 1
Language: [python]:
Paste python code (Ctrl-D to end):
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        if target - num in seen:
            return [seen[target - num], i]
        seen[num] = i
    return []
^D

Submission created: 1

[████████████░░░░░░░░░░░░░░░░░░░░░░░░] Running...

Result: passed
Passed: 3/3

Test Details:
  ✓ Input: {"nums": [2, 7, 11, 15], "target": 9}
  ✓ Input: {"nums": [3, 2, 4], "target": 6}
  ✓ Input: {"nums": [1, 5, 10, 2], "target": 7}

# ============================================================
# 12. Check queue status
# ============================================================

$ duck queue:status
Active Jobs:

Registered Tasks:
  celery@alice: 4 tasks
    - app.tasks.execution.execute_submission
    - app.tasks.ai_generation.generate_problem
    - app.tasks.validation.validate_generated_problem
    - app.tasks.analytics.compute_class_stats

Worker Stats:
  celery@alice
    Processed: 2
    Pool: prefork

# ============================================================
# 13. View submissions
# ============================================================

$ duck submit:list --student-id 56 --limit 5
Recent submissions:

[    1] Two Sum                          completed   ✓ passed

# ============================================================
# 14. Student submits broken code
# ============================================================

$ duck submit:run
Student ID: 56
Problem ID: 1
Language: [python]:
Paste python code (Ctrl-D to end):
def twoSum(nums, target):
    return []  # Wrong implementation
^D

Submission created: 2

[████████████░░░░░░░░░░░░░░░░░░░░░░░░] Running...

Result: failed
Passed: 0/3

Test Details:
  ✗ Input: {"nums": [2, 7, 11, 15], "target": 9}
    Expected: [0, 1]
    Got: []
  ✗ Input: {"nums": [3, 2, 4], "target": 6}
    Expected: [1, 2]
    Got: []
  ✗ Input: {"nums": [1, 5, 10, 2], "target": 7}
    Expected: [0, 3]
    Got: []

# ============================================================
# 15. Generate AI problems
# ============================================================

$ duck ai:generate-assignment
Teacher ID: 57
Concept: recursion
Skill Level: [intermediate]:
Language: [python]:
Count: [1]: 3

Generating [████████████████████████████████████] 3/3
✓ Generated 3 problems
  Request ID: 1
  Status: completed

  [1] [green]passed[space]
  [2] [green]passed[space]
  [3] [yellow]failed[space]

# ============================================================
# 16. List generated problems for review
# ============================================================

$ duck ai:list-generated --request-id 1
Generated problems for request 1:

  ID: 1
  Title: Climb Stairs
  Validation: passed
  Plagiarism: 0.23

  ID: 2
  Title: Fibonacci Sequence
  Validation: passed
  Plagiarism: 0.18

  ID: 3
  Title: Reverse String Recursively
  Validation: failed
  Plagiarism: N/A

# ============================================================
# 17. Approve generated problems
# ============================================================

# Via CLI (future enhancement):
$ duck ai:approve --generated-id 1
✓ Problem approved and published: problem_id=2

# Via HTTP:
$ curl -X PATCH http://localhost:8000/api/v1/ai/generated-problems/1/approve \
  -H "Authorization: Bearer {token}"

{
  "id": 1,
  "problem_id": 2,
  "teacher_approved": true,
  "validation_status": "passed"
}

# ============================================================
# 18. Create assignment with generated problem
# ============================================================

$ duck dev:create-assignment
Class ID: 1
Problem ID: 2
Title: Homework: Climb Stairs
Due Date: 2024-01-25T23:59:59Z
✓ Assignment created: 2

# ============================================================
# 19. Get class analytics
# ============================================================

$ duck analytics:class-stats --class-id 1
Class Analytics: AP Computer Science Principles

Students Enrolled: 50
Total Submissions: 4
Average Success Rate: 75.0%

Problems Assigned: 2
- Two Sum: 3 submissions, 66.7% success
- Climb Stairs: 1 submissions, 100% success

Top Performers:
  1. alice (2 problems solved)

Recent Activity:
  [2024-01-15 12:45] alice passed "Two Sum"
  [2024-01-15 12:30] alice failed "Two Sum"

# ============================================================
# 20. Get student analytics
# ============================================================

$ curl http://localhost:8000/api/v1/analytics/me/summary \
  -H "Authorization: Bearer {alice_token}" | jq

{
  "problems_attempted": 2,
  "problems_solved": 2,
  "success_rate": 1.0,
  "total_submissions": 3,
  "recent_submissions": [
    {
      "submission_id": 2,
      "problem_id": 1,
      "status": "completed",
      "result": "passed",
      "submitted_at": "2024-01-15T12:35:00Z"
    },
    ...
  ],
  "trails": []
}

# ============================================================
# 21. Test execution sandbox directly
# ============================================================

$ duck sandbox:test
Language: python
Code:
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
^D

Input (optional):

[████████████████████████████░░░░░░░░░░] Executing...

Output:
55

Execution Time: 12ms

# ============================================================
# 22. Benchmark execution performance
# ============================================================

$ duck sandbox:benchmark
Language: python
Test cases: 100
Code complexity: mixed

Running 100 executions...
[████████████████████████████████████████] 100/100

Results:
  Min: 2ms
  Max: 156ms
  Avg: 42ms
  P50: 35ms
  P95: 98ms
  P99: 142ms

✓ Sandbox performance stable

# ============================================================
# 23. Inspect problem difficulty calibration
# ============================================================

$ duck analytics:problem-difficulty
Problem Difficulty Calibration:

ID    Title              Current  Success Rate  Time (avg)  Recommendation
1     Two Sum            easy     66.7%         89ms        → medium
2     Climb Stairs       medium   100%          124ms       → easy
3     Fibonacci Seq      medium   50%           245ms       ↑ hard

# ============================================================
# 24. Clear queue for fresh start
# ============================================================

$ duck queue:clear
Clear ALL pending jobs? [y/N]: y
✓ Queue cleared

# ============================================================
# 25. Create a trail (Flight Path)
# ============================================================

$ duck dev:create-trail
Name: Python Fundamentals
Skill Level: beginner
Problems: 1,2,3,4,5
✓ Trail created: 1

# ============================================================
# 26. Full end-to-end test
# ============================================================

$ duck test:end-to-end
Running end-to-end test suite...

[✓] User registration
[✓] Class creation
[✓] Problem creation
[✓] Assignment creation
[✓] Student joins class
[✓] Student views problems
[✓] Student submits code
[✓] Execution completes
[✓] Results visible to teacher
[✓] Analytics computed
[✓] AI generation requested
[✓] Generated problem validated
[✓] Problem published

All tests passed ✓

```

---

## Summary

This backend architecture is:

1. **Modular** — Clean service separation, easy to test and extend
2. **Scalable** — From MVP (single server) to enterprise (Kubernetes)
3. **Developer-friendly** — Local Docker Compose, rich CLI for testing
4. **Production-ready** — Error handling, logging, monitoring, security
5. **Future-proof** — AI-first design, extensible problem types, event-driven

The architecture prioritizes:

- **Student experience** — Fast execution, real-time feedback
- **Teacher power** — AI generation, class analytics, flexible assignment
- **Developer velocity** — Modular code, clear interfaces, good testing tools

**Ready to build the frontend React app that consumes these APIs!**
