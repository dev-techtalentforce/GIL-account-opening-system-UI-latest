
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
// import { NsdlService } from 'src/app/services/nsdl.service';
// import { AgentService } from 'src/app/services/agent.service';
// import { WalletService } from 'src/app/services/wallet.service';
import { ToastrService } from 'ngx-toastr';
import { AnyMxRecord } from 'node:dns';
import { WalletBalanceResponse } from '../../Models/wallet-model';
import { NsdlService } from '../../Services/nsdl-service';
import { WalletService } from '../../Services/wallet-service';
import { CommonModule } from '@angular/common';
// import { WalletBalanceResponse } from 'src/app/models/wallet-model';
// import { AgentDetails } from 'src/app/models/agent-model';


@Component({
  selector: 'app-agent-dashboard-component',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agent-dashboard-component.html',
  styleUrl: './agent-dashboard-component.css'
})
export class AgentDashboardComponent implements OnInit {
  accountsForm: FormGroup;
  walletDetails: WalletBalanceResponse = {
    agentId: '',
    walletBalance: 0,
    availableCredits: 0,
    lastTransactionDate: ''
  };
  panNo = '';
  response = {
    response: 'Record Found',
    respcode: '00',
    custdetails: []
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private nsdlService: NsdlService,
    // private agentService: AgentService,
    private walletService: WalletService,
    private toastr: ToastrService
  ) {
    this.accountsForm = this.fb.group({
      accounts: this.fb.array([])
    });
  }
  paymentData: any[] = [];
  totalBalance: number = 0;
  credits: number = 0;



  ngOnInit(): void {
    this.walletService.getWalletBalance().subscribe((data: WalletBalanceResponse) => {
    this.walletDetails = data;
  });

  const agentId = 1;
  this.walletService.getPaymentsByAgentId(agentId).subscribe({
    next: (data) => {
      this.paymentData = data;

      // Calculate total balance
      const totalBalance = data.reduce((sum: number, item: any) => sum + item.amount, 0);
      console.log('Total Wallet Balance:', totalBalance);

      // Save to class variable
      this.totalBalance = totalBalance;

      // ✅ Calculate credits here, AFTER totalBalance is set
      this.credits = Math.floor(this.totalBalance / 100);
      console.log('Credits:', this.credits);
    },
    error: (err) => console.error('Error fetching payments', err)
  });
  }

  get accountsArray(): FormArray {
    return this.accountsForm.get('accounts') as FormArray;
  }

  fetchCustomer(panNo: string) {
    const params = { pan: panNo };
    this.nsdlService.fetchCustomers(params).subscribe({
      next: (response: any) => {
        this.response = response;
        this.populateAccountsForm(response.custdetails);
      },
      error: (error: any) => this.toastr.error(error)
    });
  }

  populateAccountsForm(data: any[]) {
    const controlArray = data.map(item =>
      this.fb.group({
        account_number: [item.account_number],
        account_type: [item.account_type],
        account_open_dt: [item.account_open_dt],
        branch_name: [item.branch_name],
        bank_name: [item.bank_name],
        cust_name: [item.cust_name],
        pan: [item.pan],
        ifsc: [item.ifsc]
      })
    );
    this.accountsForm.setControl('accounts', this.fb.array(controlArray));
  }

  openAppInNewTab() {
    this.router.navigate(['/add-balance']);
  }



}
