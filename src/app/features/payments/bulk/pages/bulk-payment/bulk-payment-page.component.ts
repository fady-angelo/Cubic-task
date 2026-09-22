import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { messageFromError } from '../../../../../core/errors/message-from-error';
import { BulkSummaryComponent } from '../../components/bulk-summary/bulk-summary.component';
import { BulkRowViewportComponent } from '../../components/bulk-row-viewport/bulk-row-viewport.component';
import { BulkIntakeState, BulkSubmitResult } from '../../models/bulk-payment.models';
import { BulkCsvIntakeService } from '../../services/bulk-csv-intake.service';
import { BulkPaymentCommandService } from '../../services/bulk-payment-command.service';
import { acceptBulkCsvFile } from '../../utils/accept-bulk-csv-file';
import { canSubmitBulkFile } from '../../utils/can-submit-bulk-file';
import { mergeBulkServerRejects } from '../../utils/merge-bulk-server-rejects';
import { visibleBulkRows } from '../../utils/visible-bulk-rows';

@Component({
  selector: 'app-bulk-payment-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, BulkSummaryComponent, BulkRowViewportComponent],
  templateUrl: './bulk-payment-page.component.html',
})
export class BulkPaymentPageComponent {
  private readonly intakeService = inject(BulkCsvIntakeService);
  private readonly commands = inject(BulkPaymentCommandService);
  private readonly destroyRef = inject(DestroyRef);
  private fileGeneration = 0;

  readonly intake = signal<BulkIntakeState>({ kind: 'idle' });
  readonly invalidOnly = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitResult = signal<BulkSubmitResult | null>(null);

  readonly canSubmit = computed(() => canSubmitBulkFile(this.intake(), this.submitting()));

  readonly visibleRows = computed(() => {
    const state = this.intake();
    if (state.kind !== 'parsed') {
      return [];
    }
    const merged = mergeBulkServerRejects(
      state.validation.rows,
      this.submitResult()?.rejectedRows ?? [],
    );
    return visibleBulkRows(merged, this.invalidOnly());
  });

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    const file = input.files?.[0];
    const generation = ++this.fileGeneration;
    this.resetSubmit();
    this.invalidOnly.set(false);
    this.intakeService.cancelPending();
    if (!file) {
      this.intake.set({ kind: 'idle' });
      return;
    }
    await this.applyFile(file, generation);
  }

  setInvalidOnly(invalidOnly: boolean): void {
    this.invalidOnly.set(invalidOnly);
  }

  submitBulk(): void {
    const state = this.intake();
    if (!canSubmitBulkFile(state, this.submitting()) || state.kind !== 'parsed') {
      return;
    }
    this.submitting.set(true);
    this.submitError.set(null);
    this.submitResult.set(null);
    this.commands
      .submit(state.csvText, this.commands.newClientRequestId())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe({
        next: (result) => this.submitResult.set(result),
        error: (error: unknown) => this.submitError.set(messageFromError(error)),
      });
  }

  private async applyFile(file: File, generation: number): Promise<void> {
    const accepted = acceptBulkCsvFile(file);
    if (!accepted.ok) {
      this.setIfCurrent(generation, {
        kind: 'rejected',
        fileName: file.name,
        reject: accepted.reject,
      });
      return;
    }
    this.setIfCurrent(generation, { kind: 'working', fileName: file.name });
    const text = await file.text();
    if (generation !== this.fileGeneration) {
      return;
    }
    const next = await this.intakeService.ingest(file.name, text);
    if (next) {
      this.setIfCurrent(generation, next);
    }
  }

  private setIfCurrent(generation: number, state: BulkIntakeState): void {
    if (generation === this.fileGeneration) {
      this.intake.set(state);
    }
  }

  private resetSubmit(): void {
    this.submitError.set(null);
    this.submitResult.set(null);
  }
}
