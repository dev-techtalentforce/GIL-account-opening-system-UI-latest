import { Component, OnInit, inject, input } from '@angular/core';
import { Location } from '@angular/common';

// Project imports
import { NavigationItem } from '../../navigation';
import { NavItemComponent } from '../nav-item/nav-item.component';
import { NavCollapseComponent } from '../nav-collapse/nav-collapse.component';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-nav-group',
  standalone: true,
  imports: [SharedModule, NavItemComponent, NavCollapseComponent],
  templateUrl: './nav-group.component.html',
  styleUrls: ['./nav-group.component.scss']
})
export class NavGroupComponent implements OnInit {
  private location = inject(Location);

  // Angular 16+ required input
  readonly item = input.required<NavigationItem>();

  ngOnInit(): void {
  let currentUrl = this.location.path();
  const baseHref = (this.location as any)?._baseHref ?? '';
  if (baseHref) {
    currentUrl = baseHref + currentUrl;
  }

  const selector = `a.nav-link[href='${currentUrl}']`;
  const linkElement = document.querySelector(selector) as HTMLElement | null;

  if (!linkElement) {
    console.warn('Navigation element not found for current URL:', currentUrl);
    return;
  }

  const parentMenu = linkElement.closest('.pcoded-hasmenu') as HTMLElement | null;
  const allParents = this.collectAllMenuParents(parentMenu);

  allParents.forEach(el => {
    el.classList.add('pcoded-trigger', 'active');
  });
}


  private collectAllMenuParents(start: HTMLElement | null): HTMLElement[] {
    const collected: HTMLElement[] = [];
    let el = start;

    while (el) {
      if (el.classList.contains('pcoded-hasmenu')) {
        collected.push(el);
      }
      el = el.parentElement?.closest('.pcoded-hasmenu') ?? null;
    }

    return collected;
  }
}
