export interface TechSkill {
  readonly name: string;
  readonly keywords: readonly string[];
}

export const TECH_SKILLS: readonly TechSkill[] = [
  { name: 'Angular',            keywords: ['angular', 'ngrx', 'angular cli', 'angular material', 'angularjs'] },
  { name: 'React',              keywords: ['react', 'reactjs', 'react.js', 'redux', 'next.js', 'nextjs', 'react native'] },
  { name: 'Vue',                keywords: ['vue', 'vuejs', 'vue.js', 'nuxt'] },
  { name: 'JavaScript',         keywords: ['javascript', 'es6', 'ecmascript', 'vanilla js', 'node.js', 'nodejs', 'express.js'] },
  { name: 'TypeScript',         keywords: ['typescript'] },
  { name: 'RxJS',               keywords: ['rxjs', 'observables', 'reactive programming'] },
  { name: 'CSS/SCSS',           keywords: ['css', 'scss', 'sass', 'less', 'styled-components', 'tailwind', 'css-in-js', 'bootstrap'] },
  { name: 'Testing',            keywords: ['testing', 'jest', 'vitest', 'playwright', 'cypress', 'unit test', 'e2e', 'test driven', 'tdd'] },
  { name: 'Performance',        keywords: ['performance', 'web vitals', 'lighthouse', 'core web vitals', 'performance optimization'] },
  { name: 'Accessibility',      keywords: ['accessibility', 'a11y', 'wcag', 'aria', 'screen reader'] },
  { name: 'System Design',      keywords: ['system design', 'distributed systems', 'microservices', 'scalability', 'architecture'] },
  { name: 'GraphQL',            keywords: ['graphql', 'apollo'] },
  { name: 'REST API',           keywords: ['rest api', 'restful', 'api design', 'openapi', 'swagger'] },
  { name: 'AWS',                keywords: ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudfront', 'dynamodb'] },
  { name: 'Docker/Kubernetes',  keywords: ['docker', 'kubernetes', 'k8s', 'containerization', 'helm'] },
  { name: 'CI/CD',              keywords: ['ci/cd', 'github actions', 'jenkins', 'gitlab ci', 'devops', 'pipeline', 'circleci'] },
  { name: 'Git',                keywords: ['git', 'github', 'gitlab', 'version control', 'bitbucket'] },
  { name: 'Agile/Scrum',        keywords: ['agile', 'scrum', 'kanban', 'sprint', 'jira'] },
  { name: 'SQL/Database',       keywords: ['sql', 'postgresql', 'mysql', 'supabase', 'prisma', 'database', 'relational'] },
  { name: 'MongoDB',            keywords: ['mongodb', 'nosql', 'mongoose'] },
  { name: 'Webpack/Build',      keywords: ['webpack', 'vite', 'rollup', 'esbuild', 'bundler'] },
  { name: 'Nx/Monorepo',        keywords: ['nx', 'monorepo', 'turborepo', 'lerna'] },
  { name: 'Soft Skills',        keywords: ['communication', 'teamwork', 'collaboration', 'leadership', 'mentoring', 'ownership', 'cross-functional'] },
];

export function extractSkillNames(text: string): string[] {
  const lower = text.toLowerCase();
  return TECH_SKILLS
    .filter(skill => skill.keywords.some(kw => lower.includes(kw)))
    .map(skill => skill.name);
}
