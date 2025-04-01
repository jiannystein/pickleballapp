export interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  expiresAt?: Date;
  priority: 'low' | 'medium' | 'high';
  isActive: boolean;
}

export interface UserAnnouncement {
  userId: string;
  announcementId: string;
  dismissed: boolean;
  dismissedAt?: Date;
} 