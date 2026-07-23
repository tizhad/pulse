import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompanyStore } from '../../core/stores/company.store';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { GuestContentService, GUEST_ITEM_LIMIT } from '../../core/services/guest-content.service';
import { PosthogService } from '../../core/services/posthog.service';
import type { Company, CompanyStatus } from '../../core/models/jobmate.models';

const AVATAR_PALETTE: ReadonlyArray<{ bg: string; color: string }> = [
  { bg: '#1E7A47', color: '#ffffff' },
  { bg: '#6B32B8', color: '#ffffff' },
  { bg: '#1E5FA8', color: '#ffffff' },
  { bg: '#B02B23', color: '#ffffff' },
  { bg: '#2C3E50', color: '#ffffff' },
  { bg: '#C0621A', color: '#ffffff' },
  { bg: '#00838F', color: '#ffffff' },
  { bg: '#A07C10', color: '#ffffff' },
];

@Component({
  selector: 'app-companies',
  templateUrl: './companies.component.html',
  styleUrl: './companies.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class CompaniesComponent {
  readonly store = inject(CompanyStore);
  private readonly auth = inject(AuthService);
  private readonly authModal = inject(AuthModalService);
  private readonly guestContent = inject(GuestContentService);
  private readonly posthog = inject(PosthogService);

  private requireAuth(): boolean {
    if (this.auth.isAuthenticated()) return true;
    this.authModal.open();
    return false;
  }

  private canCreateCompany(): boolean {
    if (this.auth.isAuthenticated()) return true;
    if (this.guestContent.canAddCompany()) return true;
    this.authModal.open(
      'signup',
      `You've added ${GUEST_ITEM_LIMIT} free companies — sign up to track more.`,
    );
    return false;
  }

  readonly guestCompaniesRemaining = computed(() =>
    Math.max(0, GUEST_ITEM_LIMIT - this.guestContent.companies().length),
  );

  readonly isGuest = computed(() => !this.auth.isAuthenticated());

  readonly statusOptions: { value: CompanyStatus; label: string }[] = [
    { value: 'saved', label: 'Saved' },
    { value: 'applied', label: 'Applied' },
    { value: 'interviewing', label: 'Interviewing' },
    { value: 'offer', label: 'Offer 🎉' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'no-reply', label: 'No reply' },
  ];

  readonly categoryOptions = [
    'Big Tech', 'Startup', 'Scale-up', 'Fintech', 'HealthTech',
    'E-commerce', 'SaaS', 'Agency', 'Gaming', 'Other',
  ];

  /* ── Drawer ──────────────────────────────────────────────────────────────── */

  readonly showForm = signal(false);
  readonly saving = signal(false);

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    category: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<CompanyStatus>('saved', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });

  openForm(): void {
    this.form.reset({ status: 'saved' });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  async submit(): Promise<void> {
    if (!this.canCreateCompany()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    const { name, category, status } = this.form.getRawValue();
    await this.store.addCompany(name.trim(), category, status);
    this.posthog.capture('company_added', {
      category,
      status,
    });
    this.saving.set(false);
    this.closeForm();
  }

  /* ── Edit modal ──────────────────────────────────────────────────────────── */

  readonly selectedCompany = signal<Company | null>(null);

  readonly editForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<CompanyStatus>('saved', { nonNullable: true }),
  });

  openModal(company: Company): void {
    this.editForm.reset({ name: company.name, status: company.status });
    this.selectedCompany.set(company);
  }

  closeModal(): void {
    this.selectedCompany.set(null);
  }

  async saveModal(): Promise<void> {
    if (!this.requireAuth()) return;
    this.editForm.markAllAsTouched();
    if (this.editForm.invalid) return;

    const company = this.selectedCompany();
    if (!company) return;

    this.saving.set(true);
    const { name, status } = this.editForm.getRawValue();
    await this.store.updateCompany(company.id, { name: name.trim(), status });
    if (status !== company.status) {
      this.posthog.capture('company_status_updated', {
        previous_status: company.status,
        new_status: status,
        company_name: name.trim(),
      });
    }
    this.saving.set(false);
    this.closeModal();
  }

  /* ── Avatar helpers ──────────────────────────────────────────────────────── */

  initial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  avatarBg(name: string): string {
    return AVATAR_PALETTE[this.nameHash(name) % AVATAR_PALETTE.length].bg;
  }

  avatarColor(name: string): string {
    return AVATAR_PALETTE[this.nameHash(name) % AVATAR_PALETTE.length].color;
  }

  statusClass(status: CompanyStatus): string {
    const map: Record<CompanyStatus, string> = {
      saved: 'pipe-saved', applied: 'pipe-applied', interviewing: 'pipe-interview',
      offer: 'pipe-offer', rejected: 'pipe-rejected', 'no-reply': 'pipe-noreply',
    };
    return map[status];
  }

  statusLabel(status: CompanyStatus): string {
    const map: Record<CompanyStatus, string> = {
      saved: 'Saved', applied: 'Applied', interviewing: 'Interviewing',
      offer: 'Offer 🎉', rejected: 'Rejected', 'no-reply': 'No reply',
    };
    return map[status];
  }

  private nameHash(name: string): number {
    let h = 0;
    for (let i = 0; i < name.length; i++) {
      h = (h * 31 + name.charCodeAt(i)) & 0x7fffffff;
    }
    return h;
  }
}
