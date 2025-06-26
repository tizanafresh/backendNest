export class NotificationResponseDto {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ORDER' | 'PROMOTION' | 'SYSTEM' | 'LOYALTY';
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
} 