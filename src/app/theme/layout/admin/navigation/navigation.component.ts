// angular import
import {  Component,
  OnInit,
  inject,
  Signal,
  signal,
  computed, 
  output} from '@angular/core';
import { CommonModule, isPlatformBrowser,Location, NgFor } from '@angular/common';


// project import
import { SharedModule } from '../../../shared/shared.module';
// import { NavLogoComponent } from './nav-logo/nav-logo.component';
// import { NavContentComponent } from './nav-content/nav-content.component';
// import { NavGroupComponent } from './nav-content/nav-group/nav-group.component';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NavigationItem, NavigationItems } from './navigation';
import { NavLogoComponent } from './nav-logo/nav-logo.component';
import { NavContentComponent } from './nav-content/nav-content.component';

@Component({
  selector: 'app-navigation',
  imports: [CommonModule, SharedModule, NgScrollbarModule, NavLogoComponent, NavContentComponent],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
  standalone:true
})
export class NavigationComponent implements OnInit {
    NavCollapse = output();
      NavCollapsedMob = output();


  private location = inject(Location);
  navCollapsed: boolean = false;
  navigations: NavigationItem[] = [];
  filteredNavigations: NavigationItem[] = [];

wrapperWidth: number = (typeof window !== 'undefined') ? window.innerWidth : 1024;
  windowWidth = (typeof window !== 'undefined') ? window.innerWidth : 1024;
  role: string = '';

ngOnInit() {
  const userData = localStorage.getItem('user');
  if (userData) {
    const user = JSON.parse(userData);
    this.role = user.roleId;

    console.log(user, " >>>> user");
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

  console.log(this.navigations, " >>>>> this.navigations");
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

 navCollapse() {
    if (this.windowWidth >= 992) {
      this.navCollapsed = !this.navCollapsed;
      this.NavCollapse.emit();
    }
  }
   navCollapseMob() {
    if (this.windowWidth < 992) {
      this.NavCollapsedMob.emit();
    }
  }

}
