import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { BcAgentService } from '../../Services/bc-agent-service';
import { Toast, ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-bc-agent-registration',
 imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './bc-agent-registration.html',
  styleUrl: './bc-agent-registration.css'
})
export class BcAgentRegistration implements OnInit {
  agentForm!: FormGroup;
  showTerminalDetails = false;
  agentId: any;

  constructor(private fb: FormBuilder, private agentService: BcAgentService, private toastr: ToastrService,
  ) { }

   ngOnInit(): void {

      const userStr = localStorage.getItem('user');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.agentId = user.userId

   

    this.agentForm = this.fb.group({
      channelid: ['lfbpWjegXHwnnirQOlYP'],
      appid: ['com.jarviswebbc.nsdlpb'],
      partnerid: ['wpemmjhKus'],
      bcid: [''],
      bcagentid: [this.agentId],
      bcagentname: [user.firstName, Validators.required],
      middlename: ['', Validators.required],
      lastname: [user.lastName, Validators.required],
      companyname: ['', Validators.required],
      address: [user.address, Validators.required],
      statename: ['', Validators.required],
      cityname: ['', Validators.required],
      district: ['', Validators.required],
      area: ['', Validators.required],
      pincode: ['', Validators.required],
      mobilenumber: [user.mobile, [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      telephone: [''],
      alternatenumber: [''],
      emailid: [user.email, [Validators.required, Validators.email]],
      dob: ['', Validators.required],
      shopaddress: ['', Validators.required],
      shopstate: ['', Validators.required],
      shopcity: ['', Validators.required],
      shopdistrict: ['', Validators.required],
      shoparea: ['', Validators.required],
      shoppincode: ['', Validators.required],
      pancard: [user.pancard, [
        Validators.required,
        Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
      ]],
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
      agenttype: ['1'],
      agentbcid: [''],
      token: [''],
      signcs: [''],
    });

    this.agentForm.get('productdetails')?.valueChanges.subscribe(() => {
      this.checkDmtAeps();
    });
  }

  checkDmtAeps() {
    const productdetails = this.agentForm.get('productdetails')?.value;
    this.showTerminalDetails = productdetails.dmt && productdetails.aeps;
  }

  onSubmit() {
    if (this.agentForm.invalid) {
      this.toastr.error("Invalid form filled");
      return;
    }

    const formValues = this.agentForm.value;

    // ✅ Convert booleans to string "0"/"1"
    const convertBooleansToStrings = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(item => convertBooleansToStrings(item));
      } else if (typeof obj === 'object' && obj !== null) {
        return Object.keys(obj).reduce((acc: Record<string, any>, key: string) => {
          acc[key] = convertBooleansToStrings(obj[key]);
          return acc;
        }, {});
      } else {
        return obj === true ? "1" : obj === false ? "0" : obj;
      }
    };

    const transformedValues = convertBooleansToStrings(formValues);

    const payload = {
      channelid: transformedValues.channelid,
      appid: transformedValues.appid,
      partnerid: transformedValues.partnerid,
      bcid: "1516",
      bcagentid: this.agentId,
      bcagentname: transformedValues.bcagentname,
      middlename: transformedValues.middlename,
      lastname: transformedValues.lastname,
      companyname: transformedValues.companyname,
      address: transformedValues.address,
      statename: transformedValues.statename,
      cityname: transformedValues.cityname,
      district: transformedValues.district,
      area: transformedValues.area,
      pincode: transformedValues.pincode,
      mobilenumber: transformedValues.mobilenumber,
      telephone: transformedValues.telephone,
      alternatenumber: transformedValues.alternatenumber,
      emailid: transformedValues.emailid,
      dob: this.formatDateToMMDDYYYY(transformedValues.dob),
      shopaddress: transformedValues.shopaddress,
      shopstate: transformedValues.shopstate,
      shopcity: transformedValues.shopcity,
      shopdistrict: transformedValues.shopdistrict,
      shoparea: transformedValues.shoparea,
      shoppincode: transformedValues.shoppincode,
      pancard: transformedValues.pancard,
      bcagentform: transformedValues.bcagentform,
      productdetails: transformedValues.productdetails,
      terminaldetails: transformedValues.terminaldetails,
      agenttype: transformedValues.agenttype,
      agentbcid: "1516",
      token: transformedValues.token,
      signcs: transformedValues.signcs,
    };

    this.agentService.registerAgent(payload).subscribe({
      next: (res) => {
        if(res.respcode){
         const errorMessage = `${res.response} - ${res.agentData.bcagentregistrationres.description}`;
         this.toastr.success(errorMessage);
        } 
      // else
      //    this.toastr.success("Agent Register Successful")
        console.log('Success:', res);
      },
      error: (err) => {
        this.toastr.error("Registration failed");
        console.error('Error:', err);
      }
    });
  }
  formatDateToMMDDYYYY(dateInput: any): string {
  const date = new Date(dateInput);
  const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months start at 0!
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}


  resetForm() {
    this.agentForm.reset();
    this.agentForm.patchValue({ agenttype: '1' });
  }
}