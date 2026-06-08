import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { StudyStore } from '../stores/study.store';
import { SettingsStore } from '../stores/settings.store';
import { TECH_SKILLS, extractSkillNames } from '../constants/tech-skills';
import type { SubjectCategory, SubjectStatus, ResumeData } from '../models/jobmate.models';

// ─── Public types ──────────────────────────────────────────────────────────────

export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'staff';
export type Recommendation = 'strong' | 'worth-trying' | 'prepare-first' | 'not-ready';

export interface MatchedSkill {
  readonly name: string;
  readonly status: SubjectStatus | 'resume';
  readonly weight: number;
}

export interface JobAnalysis {
  readonly jobTitle: string | null;
  readonly company: string | null;
  readonly location: string | null;
  readonly isRemote: boolean;
  readonly salaryRange: string | null;
  readonly seniorityLevel: SeniorityLevel | null;
  readonly yearsRequired: number | null;
  readonly requiredSkills: string[];
  readonly niceToHaveSkills: string[];
  readonly matchScore: number | null;
  readonly matchedSkills: MatchedSkill[];
  readonly missingSkills: string[];
  readonly recommendation: Recommendation | 'no-data';
}

// ─── Internal constants ────────────────────────────────────────────────────────

const STATUS_WEIGHT: Record<SubjectStatus, number> = {
  mastered: 1.0,
  confident: 0.8,
  in_progress: 0.5,
  needs_review: 0.3,
  not_started: 0.0,
};


const CATEGORY_TO_SKILLS: Record<SubjectCategory, string[]> = {
  angular:       ['Angular', 'RxJS'],
  react:         ['React'],
  javascript:    ['JavaScript'],
  typescript:    ['TypeScript'],
  performance:   ['Performance'],
  testing:       ['Testing'],
  accessibility: ['Accessibility'],
  system_design: ['System Design'],
  css:           ['CSS/SCSS'],
  soft_skills:   ['Soft Skills'],
};

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class JobAnalysisService {
  private readonly http = inject(HttpClient);
  private readonly studyStore = inject(StudyStore);
  private readonly settingsStore = inject(SettingsStore);

  async fetchAndAnalyze(linkedinUrl: string): Promise<JobAnalysis> {
    const jinaUrl = `https://r.jina.ai/${linkedinUrl}`;
    const text = await firstValueFrom(
      this.http.get(jinaUrl, { responseType: 'text' }).pipe(timeout(15_000))
    );
    return this.analyzeText(text);
  }

  analyzeText(text: string): JobAnalysis {
    const parsed = this.parseText(text);
    const match = this.calculateMatch(parsed.requiredSkills);
    return { ...parsed, ...match };
  }

  // ── Parsing ──────────────────────────────────────────────────────────────

  private parseText(text: string): Omit<JobAnalysis, 'matchScore' | 'matchedSkills' | 'missingSkills' | 'recommendation'> {
    const lines = text.split('\n');

    // Title: first heading or "Title:" line from Jina metadata
    const titleMetaMatch = text.match(/^Title:\s*(.+?)(?:\s*[-|]\s*LinkedIn|\s*[-|]\s*.+)?$/im);
    const firstHeading = lines.find(l => /^#{1,3}\s/.test(l) && l.length > 5);
    let rawTitle = titleMetaMatch?.[1] ?? firstHeading?.replace(/^#+\s*/, '') ?? null;
    // Strip trailing company/brand from title ("Senior Dev at Acme | LinkedIn")
    const jobTitle = rawTitle
      ? rawTitle.replace(/\s*\|.*/g, '').replace(/\s+at\s+.+$/i, '').trim()
      : null;

    // Company: "at CompanyName" from title OR dedicated line
    const companyFromTitle = rawTitle?.match(/\bat\s+(.+)$/i)?.[1]?.trim() ?? null;
    const companyLineMatch = text.match(/(?:^company[:\s]+|^employer[:\s]+)(.+)$/im);
    const company = companyFromTitle ?? companyLineMatch?.[1]?.trim() ?? null;

    // Location
    const locationMatch = text.match(/(?:location[:\s]+|📍\s*)([^\n|·]+)/i);
    const location = locationMatch?.[1]?.trim().replace(/\s*·.*/g, '').trim() ?? null;

    // Remote
    const isRemote = /\b(remote|fully remote|work from home|wfh|distributed team)\b/i.test(text);

    // Salary — match $120k, $120,000, €80k, etc.
    const salaryMatch = text.match(/[€$£][\d,]+(?:k|K)?(?:\s*[-–—]\s*[€$£]?[\d,]+(?:k|K)?)?(?:\s*(?:per\s*year|\/yr|\/year|annually))?/);
    const salaryRange = salaryMatch?.[0]?.trim() ?? null;

    // Years of experience
    const yearsMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s*(?:professional\s+)?experience/i);
    const yearsRequired = yearsMatch ? parseInt(yearsMatch[1], 10) : null;

    // Seniority
    const seniorityLevel = this.parseSeniority(rawTitle ?? text);

    // Skill sections
    const reqSection = this.extractSection(text, [
      'requirements?', 'qualifications?', 'what you.{0,20}bring',
      'what we.{0,30}looking for', 'must have', 'you.{0,20}have', 'you bring',
    ]);
    const niceSection = this.extractSection(text, [
      'nice.to.have', 'preferred', 'bonus', 'good to have', 'plus',
    ]);

    const reqText = reqSection ?? text;
    const requiredSkills = this.extractSkills(reqText);
    const niceToHaveSkills = niceSection
      ? this.extractSkills(niceSection).filter(s => !requiredSkills.includes(s))
      : [];

    return { jobTitle, company, location, isRemote, salaryRange, seniorityLevel, yearsRequired, requiredSkills, niceToHaveSkills };
  }

  private parseSeniority(text: string): SeniorityLevel | null {
    const t = text.toLowerCase();
    if (/\bstaff\b/.test(t)) return 'staff';
    if (/\b(principal|tech lead|lead engineer|engineering lead)\b/.test(t)) return 'lead';
    if (/\bsenior\b/.test(t)) return 'senior';
    if (/\bmid[-\s]?level\b/.test(t)) return 'mid';
    if (/\b(junior|jr\.?|entry.level|associate)\b/.test(t)) return 'junior';
    return null;
  }

  private extractSection(text: string, headerPatterns: string[]): string | null {
    const pattern = headerPatterns.join('|');
    const rx = new RegExp(
      `(?:${pattern})[^\\n]{0,40}\\n([\\s\\S]*?)(?:\\n(?:#{1,3}\\s|\\*{3}|---)|$)`,
      'i',
    );
    return text.match(rx)?.[1] ?? null;
  }

  private extractSkills(text: string): string[] {
    return extractSkillNames(text);
  }

  // ── Match calculation ─────────────────────────────────────────────────────

  private calculateMatch(requiredSkills: string[]): Pick<JobAnalysis, 'matchScore' | 'matchedSkills' | 'missingSkills' | 'recommendation'> {
    if (requiredSkills.length === 0) {
      return { matchScore: null, matchedSkills: [], missingSkills: [], recommendation: 'no-data' };
    }

    const resume = this.settingsStore.settings()?.resume;
    return resume
      ? this.matchAgainstResume(requiredSkills, resume)
      : this.matchAgainstSubjects(requiredSkills);
  }

  private matchAgainstResume(
    requiredSkills: string[],
    resume: ResumeData,
  ): Pick<JobAnalysis, 'matchScore' | 'matchedSkills' | 'missingSkills' | 'recommendation'> {
    const experienceText = resume.experience.map(e => [e.title, e.company, ...e.bullets].join(' ')).join(' ');
    const experienceSkills = new Set(extractSkillNames(experienceText));
    const resumeSkillSet = new Set(resume.skills);

    const matched: MatchedSkill[] = [];
    const missingSkills: string[] = [];

    for (const skillName of requiredSkills) {
      if (experienceSkills.has(skillName)) {
        // Demonstrated in work experience → highest confidence
        matched.push({ name: skillName, status: 'resume', weight: 1.0 });
      } else if (resumeSkillSet.has(skillName)) {
        // Listed in skills section → high confidence
        matched.push({ name: skillName, status: 'resume', weight: 0.9 });
      } else {
        missingSkills.push(skillName);
      }
    }

    return this.scoreAndRecommend(matched, missingSkills, requiredSkills.length);
  }

  private matchAgainstSubjects(requiredSkills: string[]): Pick<JobAnalysis, 'matchScore' | 'matchedSkills' | 'missingSkills' | 'recommendation'> {
    const subjects = this.studyStore.subjects();
    const matched: MatchedSkill[] = [];
    const missingSkills: string[] = [];

    for (const skillName of requiredSkills) {
      const skill = TECH_SKILLS.find(s => s.name === skillName);
      if (!skill) { missingSkills.push(skillName); continue; }

      let bestWeight = 0;
      let bestStatus: SubjectStatus = 'not_started';

      for (const subject of subjects) {
        const catMatch = (CATEGORY_TO_SKILLS[subject.category] ?? []).includes(skillName);
        const titleMatch = skill.keywords.some(kw => subject.title.toLowerCase().includes(kw));

        if (catMatch || titleMatch) {
          const w = STATUS_WEIGHT[subject.status];
          if (w > bestWeight) { bestWeight = w; bestStatus = subject.status; }
        }
      }

      if (bestWeight > 0) {
        matched.push({ name: skillName, status: bestStatus, weight: bestWeight });
      } else {
        missingSkills.push(skillName);
      }
    }

    return this.scoreAndRecommend(matched, missingSkills, requiredSkills.length);
  }

  private scoreAndRecommend(
    matched: MatchedSkill[],
    missingSkills: string[],
    total: number,
  ): Pick<JobAnalysis, 'matchScore' | 'matchedSkills' | 'missingSkills' | 'recommendation'> {
    const totalWeight = matched.reduce((sum, m) => sum + m.weight, 0);
    const matchScore = Math.round((totalWeight / total) * 100);

    let recommendation: Recommendation;
    if (matchScore >= 80) recommendation = 'strong';
    else if (matchScore >= 60) recommendation = 'worth-trying';
    else if (matchScore >= 40) recommendation = 'prepare-first';
    else recommendation = 'not-ready';

    return { matchScore, matchedSkills: matched, missingSkills, recommendation };
  }
}
