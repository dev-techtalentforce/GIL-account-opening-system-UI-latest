// angular import
import { Component,Input, output, EventEmitter }from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { NgClass } from '@angular/common';

// project import


@Component({
  selector: 'app-nav-logo',
  imports: [SharedModule, RouterModule, NgClass],
  templateUrl: './nav-logo.component.html',
  styleUrls: ['./nav-logo.component.scss']
})
export class NavLogoComponent {
 @Input()
  navCollapsed: boolean = false;
  NavCollapse = output();
  windowWidth = (typeof window !== 'undefined') ? window.innerWidth : 1024;

  // public method
  navCollapse() {
    if (this.windowWidth >= 992) {
      this.navCollapsed = !this.navCollapsed;
      this.NavCollapse.emit();
    }
  }
}
