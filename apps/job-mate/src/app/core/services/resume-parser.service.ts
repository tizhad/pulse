import { Injectable } from '@angular/core';
import { extractSkillNames } from '../constants/tech-skills';
import type { ResumeData, ResumeExperience, ResumeEducation } from '../models/jobmate.models';

@Injectable({ providedIn: 'root' })
export class ResumeParserService {

  parse(rawText: string): ResumeData {
    const text = rawText.trim();
    return {
      summary:        this.extractSummary(text),
      skills:         this.extractSkills(text),
      experience:     this.extractExperience(text),
      education:      this.extractEducation(text),
      certifications: this.extractCertifications(text),
      rawText:        text,
    };
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  private extractSummary(text: string): string | null {
    const section = this.extractSection(text, ['summary', 'profile', 'about', 'objective', 'overview']);
    if (section) return section.split('\n').filter(l => l.trim()).slice(0, 3).join(' ').trim();

    // Fall back to first substantial paragraph before any section heading
    const firstPara = text.split(/\n{2,}/)[0]?.trim();
    return firstPara && firstPara.length > 40 && !/^(name|email|phone|linkedin)/i.test(firstPara)
      ? firstPara
      : null;
  }

  // ── Skills ─────────────────────────────────────────────────────────────────

  private extractSkills(text: string): string[] {
    return extractSkillNames(text);
  }

  // ── Experience ─────────────────────────────────────────────────────────────

  private extractExperience(text: string): ResumeExperience[] {
    const section = this.extractSection(text, ['experience', 'work history', 'employment', 'professional background']);
    if (!section) return [];

    const entries: ResumeExperience[] = [];
    // Split on lines that look like job titles (capitalised, possibly followed by " at " or " | ")
    const blocks = section.split(/\n(?=[A-Z][a-zA-Z\s]+(?:\s*[|@·]\s*|\s+at\s+)[A-Z])/);

    for (const block of blocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) continue;

      const titleLine = lines[0];
      const dateMatch = block.match(/(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\.?\s*\d{4}\s*[-–—]\s*(?:Present|Current|\d{4}))/i);
      const dates = dateMatch?.[1]?.trim() ?? '';

      // Try to split "Title at Company" or "Title | Company"
      const splitMatch = titleLine.match(/^(.+?)\s*(?:[|@·]|at\s+)\s*(.+)$/i);
      const title   = splitMatch?.[1]?.trim() ?? titleLine;
      const company = splitMatch?.[2]?.trim() ?? '';

      const bullets = lines
        .slice(1)
        .filter(l => /^[-•*▸►]/.test(l) || /^\d+\./.test(l))
        .map(l => l.replace(/^[-•*▸►\d.]\s*/, '').trim());

      entries.push({ title, company, dates, bullets });
    }

    return entries;
  }

  // ── Education ──────────────────────────────────────────────────────────────

  private extractEducation(text: string): ResumeEducation[] {
    const section = this.extractSection(text, ['education', 'academic background', 'qualifications']);
    if (!section) return [];

    const entries: ResumeEducation[] = [];
    const lines = section.split('\n').map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
      const yearMatch = line.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch?.[0] ?? null;

      const splitMatch = line.match(/^(.+?)\s*(?:[|,@·]|at\s+)\s*(.+)$/i);
      if (splitMatch) {
        entries.push({ degree: splitMatch[1].trim(), institution: splitMatch[2].replace(/\b(19|20)\d{2}\b/g, '').trim(), year });
      } else if (line.length > 5) {
        entries.push({ degree: line.replace(/\b(19|20)\d{2}\b/g, '').trim(), institution: '', year });
      }
    }

    return entries;
  }

  // ── Certifications ─────────────────────────────────────────────────────────

  private extractCertifications(text: string): string[] {
    const section = this.extractSection(text, ['certifications?', 'certificates?', 'licenses?', 'credentials?']);
    if (!section) return [];

    return section
      .split('\n')
      .map(l => l.replace(/^[-•*▸►\d.]\s*/, '').trim())
      .filter(l => l.length > 3);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private extractSection(text: string, headerPatterns: string[]): string | null {
    const pattern = headerPatterns.join('|');
    const rx = new RegExp(
      `(?:^|\\n)(?:${pattern})[^\\n]{0,30}\\n([\\s\\S]*?)(?=\\n(?:[A-Z][A-Z\\s]{3,}|${pattern})\\s*\\n|$)`,
      'i',
    );
    return text.match(rx)?.[1]?.trim() ?? null;
  }
}
