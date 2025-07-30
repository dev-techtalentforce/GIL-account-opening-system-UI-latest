import { Component,ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/auth-service';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-component',
   imports: [RouterLink, ReactiveFormsModule, NgbModule ,NgxSpinnerModule,CommonModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css'
})
export class LoginComponent {@ViewChild('forgotPasswordModal') forgotPasswordModal: unknown;
  loginForm: FormGroup;
  forgotPasswordForm: FormGroup;
  forgotSubmitted = false;
  loginFormSubmitted = false;
  isLoading = false;
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private spinner: NgxSpinnerService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.forgotPasswordForm = this.fb.group({
      forgotEmail: ['', [Validators.required, Validators.email]]
    });
  }

  togglePasswordVisibility() {
  this.showPassword = !this.showPassword;
}
login() {
  
    this.loginFormSubmitted = true;
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.spinner.show();
      const credentials = this.loginForm.value;
      debugger
      this.authService.login(credentials).subscribe({
        next: () => {
          if (this.isLoggedIn()) {
            if (this.isAdmin()) {
              this.router.navigateByUrl('/dashboard');
            } else if (this.isAgent() && this.isNSDL()) {
              this.router.navigateByUrl('/agent-dashboard');
            } else {
              this.router.navigateByUrl('/agentRegistration');           
            }
            this.loginForm.reset();
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          const errorMessage =
            error.status === 404
              ? 'API endpoint not found. Please contact support.'
              : error.error?.detail || 'Login failed. Please try again.';
          this.toastr.error(errorMessage);
          this.isLoading = false;
          this.spinner.hide();
        },
        complete: () => {
          this.isLoading = false;
          this.spinner.hide();
        }
      });
    } else {
      this.toastr.error('Please fill in all required fields correctly.');
    }
  }

  logout(): void {
    this.spinner.show();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigateByUrl('/login').then(() => {
      this.spinner.hide();
    });
  }

  openForgotPassword() {
    this.forgotSubmitted = false;
    this.forgotPasswordForm.reset();
    this.modalService.open(this.forgotPasswordModal);
  }

  onForgotPassword(modal: NgbModalRef) {
    this.forgotSubmitted = true;
    if (this.forgotPasswordForm.valid) {
      const Email = this.forgotPasswordForm.get('forgotEmail')?.value;
      const payload = { Email };
      this.authService.resetForgotPassword(payload).subscribe({
        next: (response:any) => {
          this.toastr.success(`Reset link sent to: ${Email}`);
          modal.close();
        },
        error: (err:any) => {
          this.toastr.error("Failed to reject user.");
        }
      });
    } else {
      this.toastr.error('Please enter a valid email.');
    }
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  isAdmin(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.roleId === 0;
  }

  isAgent(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.roleId === 1;
  }
   isNSDL(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.nsdl_status === 1;
  }
}
