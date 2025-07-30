import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../Services/auth-service';
import { Toast, ToastrService } from 'ngx-toastr';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';

@Component({
  selector: 'app-reset-password-component',
  imports: [ReactiveFormsModule, CommonModule, NgxSpinnerModule],
  templateUrl: './reset-password-component.html',
  styleUrl: './reset-password-component.css'
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  token: string = '';
  userId: any;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService,
    private authService: AuthService,
    private spinner: NgxSpinnerService
  ) {}


  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (this.token != undefined) {

    }
    else {
      this.router.navigate(['./login']);
    }
    this.resetForm = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: [this.passwordMatchValidator]
      }
    );
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  get newPassword() {
    return this.resetForm.get('newPassword');
  }

  get confirmPassword() {
    return this.resetForm.get('confirmPassword');
  }

  get isPasswordMismatch(): boolean {
    return !!(
      this.resetForm.hasError('passwordMismatch') &&
      this.confirmPassword?.touched
    );
  }


  onSubmit(): void {
    if (this.resetForm.invalid || this.isPasswordMismatch) {
      this.resetForm.markAllAsTouched();
      return;
    }
    const userStr = localStorage.getItem('user'); // Replace 'user' with your actual key
  let userId: number | null = null;

    const body = {
      Token: this.token,
      Password: this.resetForm.value.newPassword
    };
    this.spinner.show();
    this.authService.updatePassword(body).subscribe({
      next: (response:any) => {
        if (response) {
          this.router.navigate(['/login']);
        }
        else {
          this.toastr.error("Failed to reject user.");
        }
        this.spinner.hide();
      },
      error: (err:any) => {
        this.toastr.error("Failed to reject user.");
        this.spinner.hide();
      }
    });

    // console.log('Submitted:', body);
    // this.router.navigate(['/login']);

    // Uncomment when ready
    // this.http.post('/api/auth/reset-password', body).subscribe({
    //   next: () => this.router.navigate(['/login']),
    //   error: () => alert('Failed to reset password.')
    // });
//   if (userStr) {
//     try {
//       const user = JSON.parse(userStr);
//       userId = user?.userId;
//     } catch (e) {
//       console.error('Failed to parse user data from localStorage', e);
//       this.toastr.error('Invalid user session. Please log in again.');
//       this.router.navigate(['/login']);
//       return;
//     }
//   }

//   if (!userId) {
//     this.toastr.error('User ID not found. Please log in again.');
//     this.router.navigate(['/login']);
//     return;
//   }
// const payload = {
//     userId: userId,
//     passwordHash: this.resetForm.value.newPassword
//   };

//   // ✅ Step 3: Call API
//   this.authService.UpdateUserPassword(payload).subscribe({
//     next: (res) => {
//       this.toastr.success('Password has been reset successfully.');
//       this.router.navigate(['/login']);
//     },
//     error: (err) => {
//       console.error('Reset password failed:', err);
//       this.toastr.error('Failed to reset password. Please try again.');
//     }
//   });
  }

}