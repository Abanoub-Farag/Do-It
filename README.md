# Do-It

Do-It is a modern task management and productivity application designed to help you organize daily tasks, prioritize effectively, stay focused, and track your progress.

## Key Features

- **Multiple Work Views**: Switch seamlessly between a structured List View, an Eisenhower Matrix (urgent vs. important prioritization), and a Kanban Board.
- **Focus Mode**: Built-in Pomodoro timer sessions linked to specific tasks with automatic time tracking.
- **Task Organization**: Subtask checklists, color-coded priority levels (urgent, high, medium, low), and tag-based categorization.
- **Productivity Analytics**: Dashboard tracking completed tasks, focus hours, completion rates, current streaks, and a 7-day activity chart.
- **Quick Navigation**: Command bar (Ctrl+K or Cmd+K) and global hotkeys for fast task capture and view switching.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React
- **Backend**: FastAPI (Python), SQLAlchemy, Pydantic
- **Database**: PostgreSQL 16
- **Containerization**: Docker, Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your system

### Running with Docker Compose

1. Start all services using Docker Compose:
   ```bash
   docker compose up --build
   ```

   To run containers in the background (detached mode):
   ```bash
   docker compose up --build -d
   ```

2. Stop all running services:
   ```bash
   docker compose down
   ```

## Application URLs

Once the services are up and running, you can access:

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Interactive API Documentation (Swagger UI)**: http://localhost:8000/docs
- **Alternative API Documentation (ReDoc)**: http://localhost:8000/redoc