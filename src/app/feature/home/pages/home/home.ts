import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { HomeList } from "../../components/home-list/home-list";
import { LoadingAnimation } from 'app/shared/components/loading-animation/loading-animation';
import { isPlatformBrowser } from '@angular/common';


@Component({
  selector: 'app-home',
  imports: [HomeList, LoadingAnimation],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {

  onSidebarToggle: any;
  newClients: number = 0;
  isLoading = true;
  loadingTime = 3000;

  isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';

      setTimeout(() => {
        this.isLoading = false;
        document.body.style.overflow = 'auto';
      }, this.loadingTime);
    } else {
      this.isLoading = false;
    }
  }

  updateNewClients(count: number): void {
    this.newClients = count;
  }

}
