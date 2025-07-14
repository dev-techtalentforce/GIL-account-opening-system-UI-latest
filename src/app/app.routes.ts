import { Routes } from '@angular/router';
import { LoginComponent } from './Components/login-component/login-component';
import { RegistrationComponent } from './Components/registration-component/registration-component';
import { ResetPasswordComponent } from './Components/reset-password-component/reset-password-component';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { AdminDashboardComponent } from './Components/admin-dashboard-component/admin-dashboard-component';
import { UserProfile } from './Components/user-profile/user-profile';

export const routes: Routes = [
  {path: '', pathMatch:'full', redirectTo: 'login'},
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegistrationComponent
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent
  },
  {
    path:'update-profile',
    component:UserProfile
  },
{
   path: '',
        component: AdminComponent,
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./Components/admin-dashboard-component/admin-dashboard-component').then((c) => c.AdminDashboardComponent),
            },
        ],
      },
  {
    path: '**',
    redirectTo: 'login'
  }
];
