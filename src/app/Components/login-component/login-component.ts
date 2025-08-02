import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/auth-service';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import { CommonModule } from '@angular/common';
import { AgentService } from '../../Services/agent-service';
import { BcAgentService } from '../../Services/bc-agent-service';

@Component({
  selector: 'app-login-component',
  imports: [RouterLink, ReactiveFormsModule, NgbModule, NgxSpinnerModule, CommonModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css'
})
export class LoginComponent {
  @ViewChild('forgotPasswordModal') forgotPasswordModal: unknown;
  loginForm: FormGroup;
  forgotPasswordForm: FormGroup;
  forgotSubmitted = false;
  loginFormSubmitted = false;
  isLoading = false;
  showPassword = false;
  AgentId: any;
  nsdlStatus: any;

  constructor(
    private authService: AuthService,
    private bcAgentService: BcAgentService,
    private agentService: BcAgentService,
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

  ngOnInit() {
    localStorage.clear();

    // const nsdlAgent = localStorage.getItem('NsdlRegisterAgentData');
    // const agent=JSON.parse(localStorage.getItem('NsdlRegisterAgentData')||'{}');
    // this.NsdlRegisterAgentId= agent.bcagentid;


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

      this.authService.login(credentials).subscribe({
        next: () => {
          const userStr = localStorage.getItem('user');
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          this.AgentId = user.userId
          //first get agnet and store in localstorage.
          this.authService.GetAgentLoginData(this.AgentId).subscribe({
            next: (res) => {
              localStorage.setItem('NsdlStatus', JSON.stringify(res));
              const userStr = localStorage.getItem('NsdlStatus');
              const user = JSON.parse(localStorage.getItem('NsdlStatus') || '{}');
              this.nsdlStatus = user.nsdl_status

              console.log('Record stored in localStorage:', res);
            }
          });

          //set new nsdl agent register data
          this.agentService.getRegisterAgentById(this.AgentId).subscribe({
            next: (res) => {
              localStorage.setItem('NsdlRegisterAgentData', JSON.stringify(res));
              console.log('Record stored in localStorage:', res);
            }
          });
          //get new nsdl register agent data.
          const nsdlAgent = localStorage.getItem('NsdlRegisterAgentData');
          const NsdlRegisterAgentData = JSON.parse(localStorage.getItem('NsdlRegisterAgentData') || '{}');
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
    debugger;
    if (this.isLoggedIn()) {
      if (this.isAdmin()) {
        this.router.navigateByUrl('/dashboard');
      }
      else if (this.nsdlStatus == 1) {
        this.router.navigateByUrl('/agent-dashboard');
      }
      else if (this.nsdlStatus == 0) {
        this.router.navigateByUrl('/agentRegistration');
      }
      else {
        this.toastr.error("routing issue...")
      }
      this.loginForm.reset();
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
      this.spinner.show();
      const Email = this.forgotPasswordForm.get('forgotEmail')?.value;
      const payload = { Email };
      this.authService.resetForgotPassword(payload).subscribe({
        next: (response: any) => {
          this.spinner.hide();
          this.toastr.success(`Reset link sent to: ${Email}`);
          modal.close();
        },
        error: (err: any) => {
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
