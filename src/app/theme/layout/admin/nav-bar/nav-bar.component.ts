import { Component, EventEmitter, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// Project imports
import { SharedModule } from '../../../shared/shared.module';
import { NavLeftComponent } from './nav-left/nav-left.component';
import { NavRightComponent } from './nav-right/nav-right.component';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule, NavLeftComponent, NavRightComponent],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent {
  @Output() readonly NavCollapsedMob = new EventEmitter<void>();

  navCollapsedMob = false;
  headerStyle = '';
  menuClass = false;
  collapseStyle = 'none';
  isMenuOpen = false;

  toggleMobOption(): void {
    this.menuClass = !this.menuClass;
    this.headerStyle = this.menuClass ? 'none' : '';
    this.collapseStyle = this.menuClass ? 'block' : 'none';
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeMenu();
    }
  }
  onMenuToggle(isOpen: boolean) {
  this.isMenuOpen = isOpen;
}

  closeMenu(): void {
    const nav = document.querySelector('app-navigation.pcoded-navbar') as HTMLElement | null;
    if (nav?.classList.contains('mob-open')) {
      nav.classList.remove('mob-open');
    }
  }
}
