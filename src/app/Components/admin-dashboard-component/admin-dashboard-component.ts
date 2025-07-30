import { Component ,OnInit } from '@angular/core';
// import { AgentService } from 'src/app/services/agent.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/auth-service';
import { CommonService } from '../../Services/common-service';
import { CommonModule } from '@angular/common';
import { AgentService } from '../../Services/agent-service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material/dialog';
import { AgentDetailModalComponent } from '../../theme/shared/modal/agent-detail-modal/agent-detail-modal.component';
import { WalletService } from '../../Services/wallet-service';

@Component({
  selector: 'app-admin-dashboard-component',
    standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard-component.html',
  styleUrl: './admin-dashboard-component.css'
})
export class AdminDashboardComponent implements OnInit {
  rowData: any[] = [];
  errorMessage: string = '';

  userId: any;
  paymentData: any;
  totalBalance: number = 0;
  credits: number = 0;

  constructor(
    // private agentService: AgentService,
    private authService: AuthService,
    private agentService:AgentService,
    private commonService: CommonService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    private walletService: WalletService
  ) {}

  ngOnInit() {
    debugger;
    this.loadAgents();
  }

  loadAgents() {
    debugger;
    this.agentService.getAgentAllList().subscribe({
      next: (response:any) => {
        this.rowData = response;
        console.log("response of getList of agent :-", response)
      },
      error: (error:any) => {
        console.error('Error loading agents:', error);
      }
    });
  }

  onApprove(userId: number) {
    const payload = { userId, status: true };
    this.commonService.patchUserStatus(payload).subscribe({
      next: () => {
        this.toastr.success("User approved successfully");
        this.loadAgents();
      },
      error: (err:any) => {
        this.toastr.error("Failed to approve user.");
      }
    });
  }

  onReject(userId: number) {
    const payload = { userId, status: false };
    this.commonService.patchUserStatus(payload).subscribe({
      next: () => {
        this.toastr.success("User rejected successfully");
        this.loadAgents();
      },
      error: (err:any) => {
        this.toastr.error("Failed to reject user.");
      }
    });
  }

  onBlockToggle(user: any) {
  debugger
    const newBlockStatus = user.blockStatus === 0 ? 1 : 0;
    const email =  user.email;
    const status=false;
    const payload = { userId: user.userId,email,status, blockStatus: newBlockStatus };
    this.commonService.patchUserStatus(payload).subscribe({
      next: () => {
        this.toastr.success(`User ${newBlockStatus === 0 ? 'unblocked' : 'blocked'} successfully`);
        this.loadAgents();
      },
      error: (err:any) => {
        this.toastr.error("Failed to update block status.");
      }
    });
  }

  OpenModalAgentDetails(userId: number) {
    const payload = { userId };
    this.commonService.AgentDetail(payload).subscribe({
      next: (response:any) => {
        this.PaymentByAgentId(userId, response);
      },
      error: (err:any) => {
        this.toastr.error("Failed to reject user.");
      }
    });
  }

  PaymentByAgentId(userId: any, agentResponse: any) {
    const agentId = 1;
    this.walletService.getPaymentsByAgentId(agentId).subscribe({
      next: (data) => {
        this.paymentData = data;

        // Calculate total balance
        // const totalBalance = data.reduce((sum: number, item: any) => sum + item.amount, 0);
        // console.log('Total Wallet Balance:', totalBalance);

        // // Save to class variable
        // this.totalBalance = totalBalance;

        // // ✅ Calculate credits here, AFTER totalBalance is set
        // this.credits = Math.floor(this.totalBalance / 100);
        // console.log('Credits:', this.credits);

        // modal
        const dialogRef = this.dialog.open(AgentDetailModalComponent, {
          width: '90%',
          height: '70%',
          data: {userId: userId, agetDetailData: agentResponse, agentPaymentData: this.paymentData}
        });

        dialogRef.afterClosed().subscribe(result => {
          console.log('The dialog was closed');
        });
      },
      error: (err) => console.error('Error fetching payments', err)
    });
  }
}