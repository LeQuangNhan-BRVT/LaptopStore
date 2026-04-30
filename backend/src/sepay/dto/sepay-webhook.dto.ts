export class SepayWebhookDto {
    id: number;
    gateway: string;
    transactionDate: string;
    accountNumber: string;
    code: string;
    content: string; 
    transferType: string;
    transferAmount: number; 
    accumulated: number;
    referenceCode: string;
    description: string;
  }