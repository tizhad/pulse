# Tracker App — Architecture

> Updated as each service and component is implemented.
> Last updated: Study Plan feature complete.

---

## Layer overview

```mermaid
flowchart TD
    subgraph Bootstrap["Bootstrap (app.config.ts)"]
        CFG["provideZonelessChangeDetection()
provideAnimations()
provideRouter(appRoutes)"]
    end

    subgraph Shell["App Shell (app.ts)"]
        APP["App
────────────
tab nav + router-outlet
OnPush"]
    end

    subgraph Data["Data (tracker.data.ts)"]
        DAT["STUDY_WEEKS
COMPANIES
RESUME_FIXES
────────────
seed values only
never in components"]
    end

    subgraph Models["Core › Models"]
        MOD["tracker.models.ts
────────────
TaskTag
CompanyStatus
FixUrgency
StudyTask / StudyWeek
Company / ResumeFix"]
    end

    subgraph Services["Core › Services"]
        STO["StorageService
────────────
load() / save() / clear()
key: tracker_v1:*
try/catch on every op"]

        STA["TrackerStateService
────────────
weeks  = signal()
companies = signal()
fixes  = signal()
────────────
toggleTask()
cycleStatus()
resolveFix()
────────────
effect() → StorageService"]

        PRG["ProgressService
────────────
taskPercent    = computed()
weekPercents   = computed()
companiesApplied = computed()
interviewsScheduled = computed()
fixPercent     = computed()"]
    end

    subgraph Shared["Shared Components"]
        PB["ProgressBarComponent
────────────
input: percent
OnPush"]

        TI["TaskItemComponent
────────────
input: task (required)
output: toggled
OnPush"]

        SB["StatusBadgeComponent
────────────
⬜ not built yet"]

    end

    subgraph Features["Features (lazy loaded)"]
        SP["StudyPlanComponent
────────────
@for weeks / tasks
collapse/expand + animation
reads: weeks signal
reads: weekPercents computed
calls: toggleTask()
OnPush"]

        DB["DashboardComponent
────────────
⬜ not built yet"]

        CO["CompaniesComponent
────────────
⬜ not built yet
@defer on viewport"]

        FX["FixesComponent
────────────
⬜ not built yet
@defer on interaction"]
    end

    %% Bootstrap → Shell
    Bootstrap --> Shell

    %% Data & Models feed Services
    DAT -->|seed fallback| STA
    MOD -->|types| DAT
    MOD -->|types| STA
    MOD -->|types| PRG

    %% Service dependencies
    STO -->|injected into| STA
    STA -->|injected into| PRG

    %% Shell loads features
    APP -->|router lazy loads| SP
    APP -->|router lazy loads| DB
    APP -->|router lazy loads| CO
    APP -->|router lazy loads| FX

    %% Features use services
    SP -->|reads weeks, calls toggleTask| STA
    SP -->|reads weekPercents| PRG
    DB -->|reads all computed stats| PRG
    CO -->|reads companies, calls cycleStatus| STA
    FX -->|reads fixes, calls resolveFix| STA

    %% Features use shared components
    SP -->|uses| PB
    SP -->|uses| TI
    CO -->|uses| SB
    DB -->|uses| PB
```

---

## Data flow: what happens when a task is checked

```mermaid
sequenceDiagram
    actor User
    participant TI as TaskItemComponent
    participant SP as StudyPlanComponent
    participant STA as TrackerStateService
    participant EFF as effect()
    participant LS as localStorage

    User->>TI: clicks checkbox
    TI->>SP: toggled.emit()
    SP->>STA: toggleTask(weekId, taskId)
    STA->>STA: weeks.update(immutable map)
    STA-->>SP: weeks signal notifies (OnPush re-render)
    STA-->>EFF: effect() re-runs (reads weeks signal)
    EFF->>LS: StorageService.save('weeks', newValue)
```

---

## Change detection: why no Zone.js

```mermaid
flowchart LR
    subgraph Old["Zone.js (removed)"]
        Z1["monkey-patches
setTimeout / fetch / etc."]
        Z2["any async op → Angular
scans entire component tree"]
        Z1 --> Z2
    end

    subgraph New["Zoneless (this app)"]
        S1["signal.set() / signal.update()"]
        S2["Angular marks only dependent
OnPush components as dirty"]
        S3["Only those components re-render"]
        S1 --> S2 --> S3
    end
```

---

## Dependency graph (no circular imports)

```mermaid
flowchart BT
    DAT["tracker.data.ts"]
    MOD["tracker.models.ts"]
    STO["storage.service.ts"]
    STA["tracker-state.service.ts"]
    PRG["progress.service.ts"]
    SP["study-plan.component"]
    PB["progress-bar.component"]
    TI["task-item.component"]
    APP["app.ts"]

    MOD --> DAT
    MOD --> STA
    MOD --> PRG
    MOD --> TI
    DAT --> STA
    STO --> STA
    STA --> PRG
    STA --> SP
    PRG --> SP
    PB --> SP
    TI --> SP
    SP --> APP
```

---

## File map

```
apps/tracker/src/app/
├── app.ts                          ← shell, tab nav, OnPush
├── app.config.ts                   ← zoneless + animations + router
├── app.routes.ts                   ← lazy routes per feature
│
├── core/
│   ├── models/
│   │   └── tracker.models.ts       ← enums + interfaces (no logic)
│   └── services/
│       ├── storage.service.ts      ← localStorage wrapper
│       ├── tracker-state.service.ts← signal() state + mutations
│       └── progress.service.ts     ← computed() derived stats
│
├── data/
│   └── tracker.data.ts             ← seed data (types only, no logic)
│
├── features/
│   ├── study-plan/                 ✅ built
│   ├── dashboard/                  ⬜ next
│   ├── companies/                  ⬜ pending
│   └── fixes/                      ⬜ pending
│
└── shared/
    └── components/
        ├── progress-bar/           ✅ built
        ├── task-item/              ✅ built
        └── status-badge/           ⬜ pending
```
