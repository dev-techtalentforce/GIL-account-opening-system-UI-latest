import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NavBarComponent } from "./theme/layout/admin/nav-bar/nav-bar.component";
// import feather from 'feather-icons';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgxSpinnerModule, NavBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone:true
})
export class App {
  constructor(private spinner: NgxSpinnerService) {
    this.spinner.show();
    setTimeout(() => this.spinner.hide(), 3000); // Test spinner
  }
  protected title = 'GIL-account-opening-system-UI-latest';
}
