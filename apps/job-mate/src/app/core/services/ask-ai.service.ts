import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { SubjectCategory } from '../models/jobmate.models';

export interface AiOutlineSection {
  readonly title: string;
  readonly bullets: string[];
}

export interface AiQuestion {
  readonly q: string;
  readonly a: string;
}

export interface AiSnippet {
  readonly lang: string;
  readonly code: string;
}

export interface AiBrief {
  readonly title: string;
  readonly summary: string;
  readonly difficulty: 'Easy' | 'Medium' | 'Hard';
  readonly category: SubjectCategory;
  readonly tags: string[];
  readonly askedBy: string[];
  readonly outline: AiOutlineSection[];
  readonly questions: AiQuestion[];
  readonly snippet: AiSnippet | null;
}

@Injectable({ providedIn: 'root' })
export class AskAiService {
  private readonly http = inject(HttpClient);

  private readonly headers = {
    Authorization: `Bearer ${environment.supabase.anonKey}`,
    'Content-Type': 'application/json',
  };

  async generateBrief(query: string): Promise<AiBrief> {
    const raw = await firstValueFrom(
      this.http.post<Record<string, unknown>>(
        `${environment.supabase.url}/functions/v1/ask-ai`,
        { query },
        { headers: this.headers },
      ),
    );

    return {
      title: (raw['title'] as string) ?? query,
      summary: (raw['summary'] as string) ?? '',
      difficulty: (raw['difficulty'] as AiBrief['difficulty']) ?? 'Medium',
      category: (raw['category'] as SubjectCategory) ?? 'javascript',
      tags: (raw['tags'] as string[]) ?? [],
      askedBy: (raw['askedBy'] as string[]) ?? [],
      outline: (raw['outline'] as AiOutlineSection[]) ?? [],
      questions: (raw['questions'] as AiQuestion[]) ?? [],
      snippet: raw['snippet'] && (raw['snippet'] as AiSnippet).code
        ? (raw['snippet'] as AiSnippet)
        : null,
    };
  }
}
