export const environment = {
  production: true,
  siteUrl: 'https://tizhad.com',
  supabase: {
    url: 'https://kmokerewodxljtywkwbi.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttb2tlcmV3b2R4bGp0eXdrd2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDg1MDUsImV4cCI6MjA5MzcyNDUwNX0.8zRWzcH9pG8Dbyx0WWVrgy70cqmar-GgVJr5CjQuxKU',
  },
  posthogKey: (import.meta as any).env?.['NG_APP_POSTHOG_PROJECT_TOKEN'] ?? 'phc_y6k8gRbejsMgEbQkifyh7Vmsz4sDc82hwxtdXRnutPPt',
  posthogHost: (import.meta as any).env?.['NG_APP_POSTHOG_HOST'] ?? 'https://us.i.posthog.com',
};
