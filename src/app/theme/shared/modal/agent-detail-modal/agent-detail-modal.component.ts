import {Component, Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-agent-detail-modal',
  imports: [CommonModule],
  templateUrl: 'agent-detail-modal.component.html',
  styleUrls: ['agent-detail-modal.component.css'],
})
export class AgentDetailModalComponent {
  paymentData: any[] = [];
  
  constructor(
    public dialogRef: MatDialogRef<AgentDetailModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      debugger
    }

  onNoClick(): void {
    this.dialogRef.close();
  }
}