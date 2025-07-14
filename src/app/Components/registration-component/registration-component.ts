import { Component,OnInit  } from '@angular/core';
import { AbstractControl, FormsModule, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/auth-service';
import { NgFor, NgIf } from '@angular/common'; // <-- Import NgIf here
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-registration-component',
  standalone: true,
  imports: [FormsModule,RouterModule,ReactiveFormsModule, CommonModule, NgIf],
  templateUrl: './registration-component.html',
  styleUrl: './registration-component.css'
})
export class RegistrationComponent implements OnInit {
   registrationForm!: FormGroup;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registrationForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
        roleId: [1, [Validators.required, Validators.min(1)]],
        isActive: [true],
        createdAt: [new Date()],
        mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        panCard: [
          '',
          [
            Validators.required,
            Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
          ],
        ],
        referralCode: [''],
        address: ['', Validators.required],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  // Custom validator to check if password and confirmPassword match
passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
  const password = form.get('password')?.value;
  const confirmPassword = form.get('confirmPassword')?.value;

  if (password && confirmPassword && password !== confirmPassword) {
    form.get('confirmPassword')?.setErrors({ mismatch: true });
    return { mismatch: true };
  }

  return null;
}

  // Easy access to form controls in template
 get f():any {
  return this.registrationForm.controls;
}

  onSubmit(): void {
    this.submitted = true;

   if (this.registrationForm.invalid) {
  this.registrationForm.markAllAsTouched();
  return;
}


    const formValue = this.registrationForm.value;

    let payload = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      passwordHash: formValue.password, // Server should hash
      isActive: formValue.isActive,
      roleId: formValue.roleId,
      createdAt: formValue.createdAt,
      refreshToken: null,
      refreshTokenExpiryTime: null,
      mobile: formValue.mobile,
      panCard: formValue.panCard,
      referralCode: formValue.referralCode || null,
      address: formValue.address,
    };

    this.authService.register(payload).subscribe({
      next: (response:any) => {
        this.toastr.success(response.message);
        this.registrationForm.reset();
        this.submitted = false;
        this.router.navigateByUrl('/login');
      },
      error: (error:any) => {
        this.toastr.error(error.message || 'Registration failed');
      },
    });
  }

}
