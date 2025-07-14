// angular import
import { Component, input } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { RouterModule } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';

// project import
import { NavigationItem } from '../../navigation';
import { NavItemComponent } from '../nav-item/nav-item.component';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-nav-collapse',
  imports: [SharedModule, NavItemComponent, RouterModule, CommonModule, NgIf],
  templateUrl: './nav-collapse.component.html',
  styleUrls: ['./nav-collapse.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', display: 'block' }),
        animate('250ms ease-in', style({ transform: 'translateY(0%)' }))
      ]),
      transition(':leave', [animate('250ms ease-in', style({ transform: 'translateY(-100%)' }))])
    ])
  ]
})
export class NavCollapseComponent {
  // Required input
  item = input.required<NavigationItem>();

  visible = false;

  navCollapse(e: MouseEvent) {
    this.visible = !this.visible;
    let parent = e.target as HTMLElement;

    // Traverse safely up to parent menu
    if (parent?.tagName === 'SPAN') {
      parent = parent.parentElement ?? parent;
    }

    parent = parent?.parentElement as HTMLElement;
    if (!parent) return;

    // Remove other open menu triggers
    const sections = document.querySelectorAll('.pcoded-hasmenu');
    sections.forEach(section => {
      if (section !== parent) {
        section.classList.remove('pcoded-trigger');
      }
    });

    let first_parent = parent.parentElement;
    let pre_parent = parent?.parentElement?.parentElement;

    // Handle nested pcoded-hasmenu
    if (first_parent?.classList.contains('pcoded-hasmenu')) {
      do {
        first_parent.classList.add('pcoded-trigger');
        first_parent = first_parent?.parentElement?.parentElement ?? null;
      } while (first_parent?.classList.contains('pcoded-hasmenu'));
    }
    // Handle nested pcoded-submenu
    else if (pre_parent?.classList.contains('pcoded-submenu')) {
      do {
        pre_parent?.parentElement?.classList.add('pcoded-trigger');
        pre_parent = pre_parent?.parentElement?.parentElement?.parentElement ?? null;
      } while (pre_parent?.classList.contains('pcoded-submenu'));
    }

    parent.classList.toggle('pcoded-trigger');
  }
}