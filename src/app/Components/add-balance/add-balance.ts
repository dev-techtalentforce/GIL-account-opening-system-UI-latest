import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
// import { AgentModel } from '../../Models/agent-model';
import { InitiatePaymentRequest, InitiatePaymentResponse } from '../../Models/wallet-model';
import { AgentService } from '../../Services/agent-service';
import { WalletService } from '../../Services/wallet-service';
import { AuthService } from '../../Services/auth-service';
import { CommonModule, NgIf } from '@angular/common';




@Component({
  selector: 'app-add-balance',
  imports: [ReactiveFormsModule, NgIf, CommonModule],
  templateUrl: './add-balance.html',
  styleUrl: './add-balance.css'
})
export class AddBalance implements OnInit {
  @ViewChild('checkoutModal') checkoutModal: any;

  form!: FormGroup;
  isAgent = true;
  paymentData: any[] = [];
  payments: any[] = [];
  totalBalance: number = 0;
  credits: number = 0;
  userData: any;
  agentId: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private agentService: AgentService,
    private walletService: WalletService,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) { }
  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.agentId = user.userId

    this.form = this.fb.group({
      amount: ['', [Validators.required, Validators.pattern(/^([1-9][0-9]*00)$/)]]
    });

    this.getlist();


  }

  getlist() {
    const id = this.agentId
    this.walletService.getPaymentsByAgentId(id).subscribe((res: any) => {
      this.paymentData = res;
      console.log("load agent data by id >>>>>>>", this.paymentData)

      // Calculate total balance
      const totalBalance = res.reduce((sum: number, item: any) => sum + item.amount, 0);
      console.log('Total Wallet Balance:', totalBalance);

      // Save to class variable
      this.totalBalance = totalBalance;

      // ✅ Calculate credits here, AFTER totalBalance is set
      this.credits = Math.floor(this.totalBalance / 100);
      console.log('Credits:', this.credits);
    });
    // this.walletService.getPaymentsByAgentId(id).subscribe({

    //   next: (data) => {
    //     this.paymentData = data;
    //     console.log("load agent data by id >>>>>>>",this.paymentData)

    //     // Calculate total balance
    //     const totalBalance = data.reduce((sum: number, item: any) => sum + item.amount, 0);
    //     console.log('Total Wallet Balance:', totalBalance);

    //     // Save to class variable
    //     this.totalBalance = totalBalance;

    //     // ✅ Calculate credits here, AFTER totalBalance is set
    //     this.credits = Math.floor(this.totalBalance / 100);
    //     console.log('Credits:', this.credits);
    //   },
    //   error: (err) => console.error('Error fetching payments', err)
    // });
  }


  onSubmit(): void {
    debugger
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const amount = +this.form.value.amount;
    const payload: any = {
      agentID: this.agentId,
      amount,
    };
debugger
    this.walletService.initiatePayment(payload).subscribe(
      (response: any) => {

        const orderId = response.orderId;  // Access the orderID inside orderId

        if (orderId) {
          payload.orderID = orderId;  // Add orderID to the payload

          // Proceed with Razorpay payment
          this.launchRazorpay(payload);
          this.toastr.success("Payment request sent successfully...");
          console.log("Razorpay order response...", orderId, "Amount:", amount);
        } else {
          this.toastr.error("Failed to retrieve order ID.");
        }
      },
      (err: any) => {
        this.toastr.error('Payment initiation failed: ' + err.message || err);
        console.log(err);
      }
    );


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
        const paymentId = response.razorpay_payment_id;
        const orderId = response.razorpay_order_id;
        const signature = response.razorpay_signature;

        const finalPayload = {
          OrderId: paymentData.orderID,
          PaymentId: paymentId,
          Signature: signature,
        };


        this.walletService.verifyPayment(finalPayload).subscribe(
          (verifyResponse) => {

            this.toastr.success('Payment verified successfully!');
          },
          (verifyError) => {

            this.toastr.error('Payment verification failed: ' + verifyError.message || verifyError);
          }
        );
      },
      theme: { color: '#198754' },
      modal: {
        ondismiss: function () {
          console.log('Payment modal was closed');
        }
      }
    };

    // Initialize Razorpay and open the payment gateway
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  }

}