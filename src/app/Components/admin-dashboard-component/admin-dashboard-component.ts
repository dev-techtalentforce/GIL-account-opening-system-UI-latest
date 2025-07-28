import { Component ,OnInit } from '@angular/core';
// import { AgentService } from 'src/app/services/agent.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/auth-service';
import { CommonService } from '../../Services/common-service';
import { CommonModule } from '@angular/common';
import { AgentService } from '../../Services/agent-service';

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

  constructor(
    // private agentService: AgentService,
    private authService: AuthService,
    private agentService:AgentService,
    private commonService: CommonService,
    private toastr: ToastrService
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
}