/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
// import { Router } from '@angular/router';
// import { ToastrService } from 'ngx-toastr';
// import { NsdlPayload } from '../../Models/nsdl-modal';
// import { AuthService } from '../../Services/auth-service';
// import { NsdlService } from '../../Services/nsdl-service';
// import * as CryptoJS from 'crypto-js';
// import { CommonService } from '../../Services/common-service';

import { BcAgentService } from '../../Services/bc-agent-service';

@Component({
  selector: 'app-account-open',
  imports: [FormsModule, CommonModule,ReactiveFormsModule],
 templateUrl: './account-open-component.html',
  styleUrl: './account-open-component.css'
})
export class AccountOpenComponent implements OnInit {
  agentForm!: FormGroup;

  constructor(private fb: FormBuilder, private agentService: BcAgentService) {}

  ngOnInit(): void {
    this.agentForm = this.fb.group({
      channelid: ['', Validators.required],
      appid: ['', Validators.required],
      partnerid: ['', Validators.required],
      bcid: ['', Validators.required],
      bcagentid: ['', Validators.required],
      bcagentname: ['', Validators.required],
      middlename: [''],
      lastname: [''],
      companyname: [''],
      address: [''],
      statename: [''],
      cityname: [''],
      district: [''],
      area: [''],
      pincode: ['', Validators.required],
      mobilenumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      telephone: [''],
      alternatenumber: [''],
      emailid: ['', [Validators.required, Validators.email]],
      dob: [''],
      shopaddress: [''],
      shopstate: [''],
      shopcity: [''],
      shopdistrict: [''],
      shoparea: [''],
      shoppincode: [''],
      pancard: [''],
      bcagentform: [''],
      productdetails: this.fb.group({
        dmt: [false],
        aeps: [false],
        cardpin: [false],
        accountopen: [false],
      }),
      terminaldetails: this.fb.group({
        tposserialno: [''],
        taddress: [''],
        taddress1: [''],
        tpincode: [''],
        tcity: [''],
        tstate: [''],
        temail: [''],
      }),
      agenttype: [''],
      agentbcid: [''],
      token: ['', Validators.required],
      signcs: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.agentForm.invalid) return;
    this.agentService.registerAgent(this.agentForm.value).subscribe({
      next: res => console.log('Success:', res),
      error: err => console.error('Error:', err)
    });
  }

  resetForm() {
    this.agentForm.reset();
  }
}
