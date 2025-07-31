import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
declare var Razorpay: any;
import {environment }  from '../../../environments/environment'


@Component({
  selector: 'app-razorpay-checkout',
 standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './razorpay-checkout.html',
  styleUrl: './razorpay-checkout.css'
})
export class RazorpayCheckout implements OnInit {
      private baseUrl = `${environment.hostURL}`;

    @Input() initialPaymentData!: {
    orderId: string;
    amount: number;
    businessID?: number;
    planID?: number;
    receipt?: string;
  };
  checkoutForm!: FormGroup;

 
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.checkoutForm = this.fb.group({
      amount: [0, [Validators.required]],
      businessID: [0],
      planID: [0],
      receipt: [''],
      orderID: [''],
      transID: [''],
      paymentStatus: ['Pending']
    });
  }

  onSubmit(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.toastr.error('Please fill the form correctly.');
      return;
    }

    const payload = this.checkoutForm.value;
    console.log('Submitting payload:', payload);

    this.http.post(`${this.baseUrl}Payments/verify`, payload).subscribe({
      next: () => this.toastr.success('Payment data submitted successfully!'),
      error: () => this.toastr.error('Error submitting payment data.')
    });
  }
}