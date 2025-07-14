import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-nav-search',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './nav-search.component.html',
  styleUrls: ['./nav-search.component.scss']
})
export class NavSearchComponent implements OnDestroy {
  searchInterval: ReturnType<typeof setInterval> | null = null;
  searchWidth = 0;
  searchWidthString = '0px';

  searchOn(): void {
    const mainSearch = document.querySelector('#main-search') as HTMLElement | null;
    if (mainSearch) {
      mainSearch.classList.add('open');
    }

    this.clearSearchInterval();

    this.searchInterval = setInterval(() => {
      if (this.searchWidth >= 170) {
        this.clearSearchInterval();
      } else {
        this.searchWidth += 30;
        this.searchWidthString = `${this.searchWidth}px`;
      }
    }, 35);
  }

  searchOff(): void {
    this.clearSearchInterval();

    this.searchInterval = setInterval(() => {
      if (this.searchWidth <= 0) {
        const mainSearch = document.querySelector('#main-search') as HTMLElement | null;
        if (mainSearch) {
          mainSearch.classList.remove('open');
        }
        this.clearSearchInterval();
      } else {
        this.searchWidth -= 30;
        this.searchWidthString = `${this.searchWidth}px`;
      }
    }, 35);
  }

  private clearSearchInterval(): void {
    if (this.searchInterval) {
      clearInterval(this.searchInterval);
      this.searchInterval = null;
    }
  }

  ngOnDestroy(): void {
    this.clearSearchInterval();
  }
}
