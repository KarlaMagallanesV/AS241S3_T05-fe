import { Component, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { isPlatformBrowser, CommonModule } from '@angular/common';

import { LoadingAnimation } from 'app/shared/components/loading-animation/loading-animation';
import { BillingList } from '../../components/billing-list/billing-list';
import { BillingForm } from '../../components/billing-form/billing-form';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LoadingAnimation,
    BillingList,
    BillingForm
  ],
  templateUrl: './billing.html',
  styleUrl: './billing.scss'
})
export class Billing {

  @ViewChild(BillingList) billingsListComponent!: BillingList;

  isLoading = true;
  searchTerm = '';

  showForm = false;

  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        this.isLoading = false;
        document.body.style.overflow = 'auto';
      }, 800);
    } else {
      this.isLoading = false;
    }
  }

  openNewBilling(): void {
    this.showForm = true;
    if (this.isBrowser) document.body.style.overflow = 'hidden';
  }

  onFormSaved(): void {
    this.showForm = false;
    if (this.isBrowser) document.body.style.overflow = 'auto';
    this.billingsListComponent?.loadBillings();
  }

  onFormCancelled(): void {
    this.showForm = false;
    if (this.isBrowser) document.body.style.overflow = 'auto';
  }

  onModalBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      this.onFormCancelled();
    }
  }
}
