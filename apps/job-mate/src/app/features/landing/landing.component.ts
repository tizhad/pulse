import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class LandingComponent {
  readonly trustedBy = ['Stripe', 'Linear', 'Notion', 'Figma', 'Vercel', 'Airbnb', 'Datadog'];

  readonly features = [
    {
      tag: 'SUBJECTS',
      tagClass: 'tag-purple',
      title: 'Track subjects forever',
      desc: 'Build your knowledge tree. Study DSA, system design, and behaviorals with questions attached.',
    },
    {
      tag: 'COMPANIES',
      tagClass: 'tag-teal',
      title: 'Companies & questions',
      desc: 'Map subjects to companies. Know exactly what to study for each target role.',
    },
    {
      tag: 'APPLICATIONS',
      tagClass: 'tag-orange',
      title: 'Application pipeline',
      desc: 'Drag to update status. Track every conversation, end-to-end.',
    },
    {
      tag: 'PRIORITIES',
      tagClass: 'tag-blue',
      title: 'Priority that adapts',
      desc: 'Ranked by interview potential. Always know what to study next.',
    },
    {
      tag: 'RESOURCES',
      tagClass: 'tag-violet',
      title: 'Resources by company',
      desc: 'Curated notes, code snippets and Q&A attached to every subject.',
    },
    {
      tag: 'DASHBOARD',
      tagClass: 'tag-orange',
      title: 'Daily heartbeat',
      desc: 'One screen to rule them all. Streak, progress, focus list, pipeline — at a glance.',
    },
  ] as const;

  readonly steps = [
    {
      num: '01',
      title: 'Capture',
      desc: 'Add every subject, company and application as you discover them. No structure needed to start.',
    },
    {
      num: '02',
      title: 'Prioritise',
      desc: 'JobMate ranks your study list by potential impact. No more guessing what to open next.',
    },
    {
      num: '03',
      title: 'Land',
      desc: 'Walk into every interview prepared. Track every offer, every stage, all the way to close.',
    },
  ] as const;
}
