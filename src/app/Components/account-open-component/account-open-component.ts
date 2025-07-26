/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup,Validators ,ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AccountOpen } from '../../Services/account-open';

@Component({
  selector: 'app-account-open',
  imports: [ReactiveFormsModule],
  templateUrl: './account-open-component.html',
  styleUrl: './account-open-component.css'
})
export class AccountOpenComponent implements OnInit  {

    form!: FormGroup;
  submitted = false;

  constructor(private fb: FormBuilder,private accountService: AccountOpen,private toastr: ToastrService) {}
  
    ngOnInit(): void {
    this.form = this.fb.group({
      // Nominee Details
      nomineeName: [''],
      nomineeDob: [''],
      relationship: [''],
      add1: [''],
      add2: [''],
      add3: [''],
      pin: [''],
      nomineeState: [''],
      nomineeCity: [''],

      // Personal Details
      customername: ['', Validators.required],
      customerLastName: [''],
      dateofbirth: [''],
      pincode: [''],
      email: ['', [Validators.email]],
      mobileNo: ['', Validators.pattern(/^[0-9]{10}$/)],

      // Other Details
      maritalStatus: [''],
      income: [''],
      middleNameOfMother: [''],
      houseOfFatherOrSpouse: [''],
      kycFlag: [''],
      panNo: [''],

      // Additional Parameters
      channelid: [''],
      partnerid: [''],
      applicationdocketnumber: [''],
      dpid: [''],
      clientid: [''],
      tradingaccountnumber: [''],
      partnerRefNumber: [''],
      partnerpan: [''],
      customerRefNumber: [''],
      customerDematId: [''],
      partnerCallBackURL: [''],
      bcid: [''],
      bcagentid: [''],

      // Agent Id
      agentId: [''],
      status: [0]
    });
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.form.invalid) return;

    const payload = this.form.value;

    this.accountService.insertAccount(payload).subscribe({
      next: (res) => {
        this.toastr.success('Account created successfully!', 'Success');
        console.log('Response:', res);
        this.form.reset();
        this.submitted = false;
      },
      error: (err) => {
        this.toastr.error('Failed to create account.', 'Error');
        console.error(err);
      }
    });
  }

  onReset(): void {
    this.submitted = false;
    this.form.reset();
  }
}
