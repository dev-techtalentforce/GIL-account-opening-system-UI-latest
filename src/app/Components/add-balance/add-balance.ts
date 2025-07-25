import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
// import { AgentModel } from '../../Models/agent-model';
import { InitiatePaymentRequest, InitiatePaymentResponse } from '../../Models/wallet-model';
import { AgentService } from '../../Services/agent-service';
import { WalletService } from '../../Services/wallet-service';
import { AuthService } from '../../Services/auth-service';
import { CommonModule } from '@angular/common';




@Component({
  selector: 'app-add-balance',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-balance.html',
  styleUrl: './add-balance.css'
})
export class AddBalance implements OnInit {
  @ViewChild('checkoutModal') checkoutModal: any;

  form!: FormGroup;
  isAgent = true;
  paymentData:any[]=[];
  payments: any[]=[]; 

  totalBalance: number = 0;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private agentService: AgentService,
    private walletService: WalletService,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) { }
  ngOnInit(): void {
    this.form = this.fb.group({
      amount: ['', [Validators.required, Validators.pattern(/^([1-9][0-9]*00)$/)]]
    });

    const agentId = 1; // Replace with dynamic ID if needed
    // this.walletService.getPaymentsByAgentId(agentId).subscribe({
    //   next: (data) => this.paymentData = data,
    //   error: (err) => console.error('Error fetching payments', err)
    // });

    this.walletService.getPaymentsByAgentId(agentId).subscribe({
  next: (data) => {
    this.paymentData = data;

    // Calculate total balance from `amount` field
    const totalBalance = data.reduce((sum: number, item: any) => sum + item.amount, 0);
    console.log('Total Wallet Balance:', totalBalance);

    // Optionally store in a class variable to display in UI
    this.totalBalance = totalBalance;
  },
  error: (err) => console.error('Error fetching payments', err)
});
  }

  // onSubmit(): void {
  //   debugger
  //   if (this.form.invalid) {
  //     this.form.markAllAsTouched();
  //     return;
  //   }

  //   const amount = +this.form.value.amount;
  //   const payload: any = {
  //     amount
  //   };

  //   this.walletService.initiatePayment(payload).subscribe((orderId: any) => {
  //     debugger
  //     payload.orderID = orderId;
  //     this.launchRazorpay(payload);
  //     this.toastr.success("Payment send successfully...")
  //     console.log("ru pay response...", orderId + "     value of ammount", amount);
  //   },
  //     (err: any) => {
  //       this.toastr.error('payment failed....' + err);
  //       console.log(err);
  //     })
  //   this.form.reset();
  // }

  onSubmit(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const amount = +this.form.value.amount;
  const paymentOption = this.form.value.paymentOption;
  
  const payload: any = {
    amount,
    paymentOption
  };

  // Call your API to initiate the payment and create the Razorpay order
  this.walletService.initiatePayment(payload).subscribe((orderId: any) => {
    // Once the order ID is received, launch the Razorpay modal
    payload.orderID = orderId;
    this.launchRazorpay(payload);  // Open Razorpay Modal
    this.toastr.success("Payment initiation successful!");
  },
  (err: any) => {
    this.toastr.error('Payment initiation failed: ' + err);
  });

  this.form.reset();
}

  launchRazorpay(paymentData: any): void {
    const options = {
      key: 'rzp_test_0Uh8LaT1c4HiZc',
      amount: paymentData.amount * 100,
      currency: 'INR',
      name: 'My Wallet',
      description: 'Add Balance',
      order_id: paymentData.orderID,
      handler: (response: any) => {
        const finalPayload = {
          ...paymentData,
          transID: response.razorpay_payment_id,
          paymentStatus: 'Success'
        };

        this.walletService.verifyPayment(finalPayload).subscribe({
          next: () => this.toastr.success('Payment verified successfully!'),
          error: () => this.toastr.error('Payment verification failed')
        });
      },
      theme: { color: '#198754' }
    };

    // const rzp = new Razorpay(options);
    // rzp.open();
  }
  
  initiatePayment(){

  }

  getPaymentMode(){

  }
}