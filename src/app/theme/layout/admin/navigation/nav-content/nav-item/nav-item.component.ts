import { Component, inject, Input } from '@angular/core';
import { CommonModule, Location, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationItem } from '../../navigation';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-nav-item',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, NgIf],
  templateUrl: './nav-item.component.html',
  styleUrls: ['./nav-item.component.scss']
})
export class NavItemComponent {
  private location = inject(Location);

  @Input() item!: any;


  ngOnInit(){
    debugger;
    let nsdlStatus:any = localStorage.getItem("NsdlStatus");
    nsdlStatus = JSON.parse(nsdlStatus);
    if(nsdlStatus.nsdl_status==0){
      if(this.item.id == "nsdl-registration"){
        this.item = {...this.item, disabled : false}
      } else {
        this.item = {...this.item, disabled : true}
      }
    } else {
if(this.item.id == "nsdl-registration"){
        this.item = {...this.item, disabled : true}
      } else {
        this.item = {...this.item, disabled : false}
      }
    }
    console.log("this.item", this.item);
  }

  closeOtherMenu(event: MouseEvent) {
    const ele = event.target as HTMLElement;
    if (ele) {
      const parent = ele.parentElement as HTMLElement;
      const up_parent = ((parent.parentElement as HTMLElement).parentElement as HTMLElement).parentElement as HTMLElement;
      const last_parent = (up_parent.parentElement as HTMLElement).parentElement as HTMLElement;

      if (last_parent?.classList.contains('pcoded-submenu')) {
        up_parent.classList.remove('pcoded-trigger', 'active');
      } else {
        const sections = document.querySelectorAll('.pcoded-hasmenu');
        for (let i = 0; i < sections.length; i++) {
          sections[i].classList.remove('active', 'pcoded-trigger');
        }
      }

      if (parent.classList.contains('pcoded-hasmenu')) {
        parent.classList.add('pcoded-trigger', 'active');
      } else if (up_parent.classList.contains('pcoded-hasmenu')) {
        up_parent.classList.add('pcoded-trigger', 'active');
      } else if (last_parent.classList.contains('pcoded-hasmenu')) {
        last_parent.classList.add('pcoded-trigger', 'active');
      }
    }

    const navElement = document.querySelector('app-navigation.pcoded-navbar');
    if (navElement?.classList.contains('mob-open')) {
      navElement.classList.remove('mob-open');
    }
  }
}
