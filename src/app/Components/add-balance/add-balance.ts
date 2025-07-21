import { Component , OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
// import { AgentModel } from '../../Models/agent-model';
import { InitiatePaymentRequest, InitiatePaymentResponse } from '../../Models/wallet-model';
import { AgentService } from '../../Services/agent-service';
import { WalletService } from '../../Services/wallet-service';
import { AuthService } from '../../Services/auth-service';
import { NgIf } from '@angular/common';




@Component({
  selector: 'app-add-balance',
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './add-balance.html',
  styleUrl: './add-balance.css'
})
export class AddBalance implements OnInit {
  @ViewChild('checkoutModal') checkoutModal: any;

 form!: FormGroup;
  isAgent = true;
  paymentData: any = {};


  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private agentService: AgentService,
    private walletService: WalletService,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) {}
   ngOnInit(): void {
    this.form = this.fb.group({
      amount: ['', [Validators.required, Validators.pattern(/^([1-9][0-9]*00)$/)]]
    });
  }

  onSubmit(): void {
    debugger
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const amount = +this.form.value.amount;
    const payload:any = {
      amount,
      businessID: 123,
      planID: 456,
      receipt: 'order_' + new Date().getTime(),
      orderID: '',
      transID: '',
      paymentStatus: 'Pending'
    };

    this.walletService.initiatePayment(payload).subscribe((orderId: any) => {
// payload.orderID = orderId;
        this.launchRazorpay(payload);
        this.toastr.success("Payment send successfully...")
        console.log("ru pay response...", orderId +"     value of ammount",amount);
    }, 
    (err: any) => {
this.toastr.error('payment failed....'+err);
console.log(err);
    })

 /*    this.walletService.initiatePayment(payload).subscribe({
      next: (orderId: string) => {
        debugger
        payload.orderID = orderId;
        this.launchRazorpay(payload);
        console.log("ru pay response...", orderId);
      },
      error: (err) => this.toastr.error('Rupay on '+err)
    }); */

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
}