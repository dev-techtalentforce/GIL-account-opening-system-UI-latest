// angular import
import { Component, inject, OnDestroy, OnInit } from '@angular/core';

// bootstrap import
import { NgbDropdownConfig } from '@ng-bootstrap/ng-bootstrap';

// project import
import screenfull from 'screenfull';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav-right',
  imports: [SharedModule, RouterLink,CommonModule, RouterModule],
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss'],
  providers: [NgbDropdownConfig]
})
export class NavRightComponent implements OnInit, OnDestroy {
  screenFull = true;
  userData: any;
  firstName:any;
  lastName : any;
  // public props

  // constructor
  constructor(private router: Router) {
    const config = inject(NgbDropdownConfig);

    config.placement = 'bottom-right';
  }

  ngOnInit(): void {
      const userStr = localStorage.getItem('user');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.firstName=user.firstName;
      this.lastName=user.lastName;
   

    if (screenfull.isEnabled) {
      this.screenFull = screenfull.isFullscreen; // Initialize based on current fullscreen state
      screenfull.on('change', () => {
        this.screenFull = screenfull.isFullscreen;
      });
    }
  }
  ngOnDestroy(): void {
    if (screenfull.isEnabled) {
      screenfull.off('change', () => {
        this.screenFull = screenfull.isFullscreen;
      });
    }
  }

  toggleFullscreen() {
    if (screenfull.isEnabled) {
      screenfull.toggle().then(() => {
        this.screenFull = screenfull.isFullscreen;
      });
    }
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('userData');
    this.router.navigate(['/login']);
  }
}
