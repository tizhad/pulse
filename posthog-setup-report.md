<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the **JobMate** Angular 21 app. A new singleton `PosthogService` was created and initialized in the root component. 14 custom events were instrumented across 7 feature files covering the full user journey — from landing page acquisition through signup, job application management, study subject tracking, company research, and resume upload. User identification is called on every successful sign-in or sign-up, linking all events to a known PostHog person. Sign-out also calls `posthog.reset()` to cleanly end the session. PostHog is initialized with `capture_exceptions: true` for automatic error tracking.

PostHog credentials are stored in `.env` and referenced from `src/environments/environment.ts` and `environment.prod.ts`.

| Event | Description | File |
|-------|-------------|------|
| `landing_page_viewed` | User viewed the landing page (unauthenticated) — top of acquisition funnel | `features/landing/landing.component.ts` |
| `user_signed_up` | User successfully created a new account | `features/auth/auth.component.ts` |
| `user_signed_in` | User successfully signed in to their account | `features/auth/auth.component.ts` |
| `user_signed_out` | User explicitly signed out | `features/settings/settings.component.ts` |
| `application_added` | User added a new job application to the pipeline | `features/applications/applications.component.ts` |
| `application_status_updated` | User changed an application's status (e.g. saved → applied → interviewing) | `features/applications/applications.component.ts` |
| `job_analyzed` | User analyzed a job posting via LinkedIn URL or pasted text | `features/applications/applications.component.ts` |
| `skill_added_to_study_plan` | User added a missing skill from a job analysis to their study plan | `features/applications/applications.component.ts` |
| `subject_created` | User created a new study subject | `features/subjects/subjects.component.ts` |
| `subject_status_updated` | User changed a subject's status (e.g. not_started → mastered) | `features/subjects/subject-detail/subject-detail.component.ts` |
| `qa_added` | User added a Q&A pair to a study subject | `features/subjects/subject-detail/subject-detail.component.ts` |
| `company_added` | User added a new company to their research list | `features/companies/companies.component.ts` |
| `company_status_updated` | User updated the status of a tracked company | `features/companies/companies.component.ts` |
| `resume_uploaded` | User pasted and saved a resume for skill matching | `features/settings/settings.component.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/469177/dashboard/1709321)
- [Acquisition Funnel: Landing → Signup → First Application](https://us.posthog.com/project/469177/insights/vKOLNyNA)
- [Daily Engagement: Signins, Applications & Study Activity](https://us.posthog.com/project/469177/insights/mNdkoYjt)
- [Application Pipeline Progression Funnel](https://us.posthog.com/project/469177/insights/UI7ehVfM)
- [Job Analysis Feature Usage](https://us.posthog.com/project/469177/insights/I1OJla76)
- [New Signups vs Returning Users](https://us.posthog.com/project/469177/insights/JMBAXDNp)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
