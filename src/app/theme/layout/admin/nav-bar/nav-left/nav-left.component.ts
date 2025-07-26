// angular import
import { Component, OnDestroy, OnInit } from '@angular/core';

// project import

//
import screenfull from 'screenfull';

import { SharedModule } from '../../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-nav-left',
  imports: [SharedModule,CommonModule, RouterModule],
  templateUrl: './nav-left.component.html',
  styleUrls: ['./nav-left.component.scss']
})
export class NavLeftComponent implements OnInit, OnDestroy {
 screenFull = true;

  private fullscreenChangeHandler = () => {
    this.screenFull = screenfull.isFullscreen;
  };

  ngOnInit() {
    if (screenfull.isEnabled) {
      this.screenFull = screenfull.isFullscreen;
      screenfull.on('change', this.fullscreenChangeHandler);
    }
  }

  ngOnDestroy() {
    if (screenfull.isEnabled) {
      screenfull.off('change', this.fullscreenChangeHandler);
    }
  }

  toggleFullscreen() {
    if (screenfull.isEnabled) {
      screenfull.toggle().then(() => {
        this.screenFull = screenfull.isFullscreen;
      });
    }
  }
}
