// angular import
import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';

// project import
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { NavigationComponent } from './navigation/navigation.component';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { Footer } from './footer/footer';

@Component({
  selector: 'app-admin',
  imports: [NavBarComponent, NavigationComponent, RouterModule, CommonModule, BreadcrumbsComponent, Footer, NgClass, RouterOutlet],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {
  // public props
  navCollapsed: any = false;
  navCollapsedMob: boolean=false;
  windowWidth: number = 1200;

 
  constructor() {}

  ngOnInit(): void {
   if (typeof window !== 'undefined') {
  this.windowWidth = window.innerWidth;
}
  }

  navMobClick(): void {
    const navElement = document.querySelector('app-navigation.pcoded-navbar');
    if (this.navCollapsedMob && navElement && !navElement.classList.contains('mob-open')) {
      this.navCollapsedMob = !this.navCollapsedMob;
      setTimeout(() => {
        this.navCollapsedMob = !this.navCollapsedMob;
      }, 100);
    } else {
      this.navCollapsedMob = !this.navCollapsedMob;
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeMenu();
    }
  }

  closeMenu(): void {
    const navElement = document.querySelector('app-navigation.pcoded-navbar');
    if (navElement && navElement.classList.contains('mob-open')) {
      navElement.classList.remove('mob-open');
    }
  }
}
