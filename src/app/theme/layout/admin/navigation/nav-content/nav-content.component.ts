import {
  Component,
  OnInit,
  inject,
  Signal,
  signal,
  computed
} from '@angular/core';
import { CommonModule, Location, NgFor } from '@angular/common';

// Dependencies
import { NavigationItem, NavigationItems } from '../navigation';
import { NavGroupComponent } from './nav-group/nav-group.component';
import { SharedModule } from '../../../../shared/shared.module';

// External Module
import { NgScrollbarModule } from 'ngx-scrollbar';

@Component({
  selector: 'app-nav-content',
  standalone: true,
  imports: [CommonModule, SharedModule, NavGroupComponent, NgScrollbarModule, NgFor],
  templateUrl: './nav-content.component.html',
  styleUrls: ['./nav-content.component.scss']
})
export class NavContentComponent implements OnInit {
  private location = inject(Location);

  navigations: NavigationItem[] = [];
  filteredNavigations: NavigationItem[] = [];

  wrapperWidth!: number;
  windowWidth!: number;
  role: string = '';

ngOnInit() {
  if (typeof window !== 'undefined') {
    this.wrapperWidth = window.innerWidth;
    this.windowWidth = window.innerWidth;
  } else {
    this.wrapperWidth = 1024;
    this.windowWidth = 1024;
  }
  const userData = localStorage.getItem('userData');
  if (userData) {
    const user = JSON.parse(userData);
    this.role = user.role;
  }

  NavigationItems.forEach((group) => {
    if (group.roles?.includes(this.role)) {
      const filteredChildren = group.children?.filter(
        (child) => child.roles?.includes(this.role)
      ) || [];

      if (filteredChildren.length > 0) {
        this.filteredNavigations.push({
          ...group,
          children: filteredChildren
        });
      }
    }
  });

  this.navigations = this.filteredNavigations;
}


  fireOutClick() {
    let current_url = this.location.path();
    if ((this.location as any)._baseHref) {
      current_url = (this.location as any)._baseHref + current_url;
    }

    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);

    if (ele) {
      const parent = ele.parentElement;
      const up_parent = parent?.parentElement?.parentElement;
      const last_parent = up_parent?.parentElement;

      if (parent?.classList.contains('pcoded-hasmenu')) {
        parent.classList.add('pcoded-trigger', 'active');
      } else if (up_parent?.classList.contains('pcoded-hasmenu')) {
        up_parent.classList.add('pcoded-trigger', 'active');
      } else if (last_parent?.classList.contains('pcoded-hasmenu')) {
        last_parent.classList.add('pcoded-trigger', 'active');
      }
    }
  }

  trackByFn(index: number, item: NavigationItem): string {
  return item.title;
}

}
