import { Component,OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password-component',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './reset-password-component.html',
  styleUrl: './reset-password-component.css'
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  token: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
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


  onSubmit() {
    if (this.resetForm.invalid || this.isPasswordMismatch) {
      return;
    }

    const body = {
      token: this.token,
      newPassword: this.resetForm.value.newPassword
    };

    console.log('Submitted:', body);
    this.router.navigate(['/login']);

    // Uncomment when ready
    // this.http.post('/api/auth/reset-password', body).subscribe({
    //   next: () => this.router.navigate(['/login']),
    //   error: () => alert('Failed to reset password.')
    // });
  }
}