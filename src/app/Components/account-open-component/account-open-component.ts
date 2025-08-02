/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AccountOpen } from '../../Services/account-open';

@Component({
  selector: 'app-account-open',
  imports: [ReactiveFormsModule],
  templateUrl: './account-open-component.html',
  styleUrl: './account-open-component.css'
})
export class AccountOpenComponent implements OnInit {

  form!: FormGroup;
  submitted = false;

  constructor(private fb: FormBuilder, private accountService: AccountOpen, private toastr: ToastrService) { }

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const nsdlAgnet = localStorage.getItem('NsdlRegisterAgentData')
    const payload= nsdlAgnet? JSON.parse(nsdlAgnet):{};

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
      customername: [''],
      customerLastName: [''],
      dateofbirth: [''],
      pincode: [''],
      email: [payload.emailid ],
      mobileNo: [payload.mobilenumber],

      // Other Details
      maritalStatus: [''],
      income: [''],
      middleNameOfMother: [''],
      houseOfFatherOrSpouse: [''],
      kycFlag: [''],
      panNo: [payload.pancard || ''],

      // Additional Parameters
      channelid: [payload.channelid || ''],
      partnerid: [payload.partnerid || ''],
      applicationdocketnumber: [''],
      dpid: [''],
      clientid: [''],
      tradingaccountnumber: [''],
      partnerRefNumber: ['PRN123456789'],
      partnerpan: ['GEQPA7729A'],
      customerRefNumber: [''],
      customerDematId: [''],
      partnerCallBackURL: ['https://partnerdomain.com/callback'],
      bcid: [payload.bcid || ''],
      bcagentid: [payload.bcagentid || ''],

      // Agent Id
      agentId: [payload.bcagentid || ''],
      status: [1]
    });
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
     
    this.submitted = true;

    if (this.form.invalid) return;

    const payload = {
      nomineeName: this.form.value.nomineeName || "",
      nomineeDob: this.form.value.nomineeDob || "",
      relationship: this.form.value.relationship || "",
      add1: this.form.value.add1 || "",
      add2: this.form.value.add2 || "",
      add3: this.form.value.add3 || "",
      pin: this.form.value.pin || "",
      nomineeState: this.form.value.nomineeState || "",
      nomineeCity: this.form.value.nomineeCity || "",
      customername: this.form.value.customername || "",
      customerLastName: this.form.value.customerLastName || "",
      dateofbirth: this.form.value.dateofbirth || "",
      pincode: this.form.value.pincode || "",
      email: this.form.value.email || "", // or static if needed
      mobileNo: this.form.value.mobileNo || "", // or static if needed
      maritalStatus: this.form.value.maritalStatus || "",
      income: this.form.value.income || "",
      middleNameOfMother: this.form.value.middleNameOfMother || "",
      houseOfFatherOrSpouse: this.form.value.houseOfFatherOrSpouse || "",
      kycFlag: this.form.value.kycFlag || "",
      panNo: this.form.value.panNo || "",
      channelid: this.form.value.channelid || "",
      partnerid: this.form.value.partnerid || "",
      applicationdocketnumber: this.form.value.applicationdocketnumber || "",
      dpid: this.form.value.dpid || "",
      clientid: this.form.value.clientid || "",
      partnerpan: this.form.value.partnerpan || "",
      tradingaccountnumber: this.form.value.tradingaccountnumber || "",
      partnerRefNumber: this.form.value.partnerRefNumber || "",
      customerRefNumber: this.form.value.customerRefNumber || "",
      customerDematId: this.form.value.customerDematId || "",
      partnerCallBackURL: this.form.value.partnerCallBackURL || "",
      bcid: this.form.value.bcid || "",
      bcagentid: this.form.value.bcagentid || "",
    };

    this.accountService.insertAccount(payload).subscribe({
      next: (res: any) => {
        if (res && res.url) {  
          // window.location.href = res.url;  
           window.open(res.url, '_blank');
        } else {
          console.error('Invalid response format');
        }


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
