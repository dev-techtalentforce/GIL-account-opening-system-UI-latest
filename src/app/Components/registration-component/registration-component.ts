import { Component,OnInit  } from '@angular/core';
import { AbstractControl, FormsModule, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/auth-service';
import { NgFor, NgIf } from '@angular/common'; // <-- Import NgIf here
import { CommonModule } from '@angular/common';
import { AgentService } from '../../Services/agent-service';


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
    private agentRegister : AgentService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  // ngOnInit(): void {
  //   this.registrationForm = this.fb.group(
  //     {
  //       firstName: ['', [Validators.required, Validators.minLength(2)]],
  //       lastName: ['', [Validators.required, Validators.minLength(2)]],
  //       email: ['', [Validators.required, Validators.email]],
  //       password: ['', [Validators.required, Validators.minLength(6)]],
  //       confirmPassword: ['', Validators.required],
  //       roleId: [1, [Validators.required, Validators.min(1)]],
  //       isActive: [true],
  //       createdAt: [new Date()],
  //       mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
  //       panCard: [
  //         '',
  //         [
  //           Validators.required,
  //           Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
  //         ],
  //       ],
  //       referralCode: [''],
  //       address: ['', Validators.required],
  //     },
  //     {
  //       validators: this.passwordMatchValidator,
  //     }
  //   );
  // }

  ngOnInit(): void {
  this.registrationForm = this.fb.group({
    channelid: ['lfbpWjegXHwnnirQOlYP', Validators.required],
    appid: ['com.jarviswebbc.nsdlpb', Validators.required],
    partnerid: ['wpemmjhKus', Validators.required],
    bcid: ['225', Validators.required],
    bcagentid: ['', Validators.required],
    bcagentname: ['', Validators.required],
    middlename: [''],
    lastname: ['', Validators.required],
    companyname: ['', Validators.required],
    address: ['', Validators.required],
    statename: ['', Validators.required],
    cityname: ['', Validators.required],
    district: ['', Validators.required],
    area: [''],
    pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    mobilenumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    telephone: [''],
    alternatenumber: [''],
    emailid: ['', [Validators.required, Validators.email]],
    dob: ['', Validators.required],
    shopaddress: ['', Validators.required],
    shopstate: ['', Validators.required],
    shopcity: ['', Validators.required],
    shopdistrict: ['', Validators.required],
    shoparea: [''],
    shoppincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    pancard: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
    bcagentform: ['', Validators.required],
    productdetails: this.fb.group({
      dmt: ['1'],
      aeps: ['1'],
      cardpin: ['0'],
      accountopen: ['1']
    }),
    terminaldetails: this.fb.group({
      tposserialno: [''],
      taddress: [''],
      taddress1: [''],
      tpincode: [''],
      tcity: [''],
      tstate: [''],
      temail: ['']
    }),
    agenttype: ['1'],
    agentbcid: ['AG010101'],
    token: [''],   // leave blank; backend fills it
    signcs: ['']   // leave blank; backend fills it
  });
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

  const payload = this.registrationForm.value;

  this.agentRegister.registerBCAgent(payload).subscribe({
    next: (response: any) => {
      this.toastr.success('Registration successful');
      this.registrationForm.reset();
      this.submitted = false;
    },
    error: (error: any) => {
      this.toastr.error(error.message || 'Registration failed');
    }
  });
}

}
