import prisma from '@/lib/prisma';

/**
 * Types of notifications in the system
 */
export enum NotificationType {
  SESSION_JOIN = 'SESSION_JOIN',                  // When a user joins a public session
  SESSION_JOIN_REQUEST = 'SESSION_JOIN_REQUEST',  // When a user requests to join a private session
  JOIN_REQUEST_APPROVED = 'JOIN_REQUEST_APPROVED', // When a join request is approved
  SESSION_CANCELLED = 'SESSION_CANCELLED',        // When a session is cancelled
  SESSION_COMPLETED = 'SESSION_COMPLETED',        // When a session is completed
  SESSION_REMINDER = 'SESSION_REMINDER',          // Reminder for upcoming session
  SESSION_UPDATED = 'SESSION_UPDATED',            // When a session is updated
  SESSION_REVIEW = 'SESSION_REVIEW',              // Reminder to review participants
  GENERAL = 'GENERAL'                             // General notifications
}

/**
 * Create a notification for a specific user
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  linkUrl,
  sessionId,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  sessionId?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        linkUrl,
        sessionId,
        isRead: false,
      },
    });
    
    console.log(`Created notification [${type}] for user [${userId}]`);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Notify host when a user has joined their public session
 */
export async function notifyHostOfSessionJoin(
  hostId: string,
  userId: string,
  userName: string,
  sessionId: string,
  sessionTitle: string
) {
  return createNotification({
    userId: hostId,
    type: NotificationType.SESSION_JOIN,
    title: 'New Participant',
    message: `${userName} has joined your session "${sessionTitle}"`,
    linkUrl: `/sessions/${sessionId}`,
    sessionId,
  });
}

/**
 * Notify host when a user requests to join their private session
 */
export async function notifyHostOfJoinRequest(
  hostId: string,
  userId: string,
  userName: string,
  sessionId: string,
  sessionTitle: string
) {
  return createNotification({
    userId: hostId,
    type: NotificationType.SESSION_JOIN_REQUEST,
    title: 'Join Request',
    message: `${userName} has requested to join your session "${sessionTitle}"`,
    linkUrl: `/sessions/${sessionId}`,
    sessionId,
  });
}

/**
 * Notify user when their join request has been approved
 */
export async function notifyUserOfJoinRequestApproval(
  userId: string,
  hostName: string,
  sessionId: string,
  sessionTitle: string
) {
  return createNotification({
    userId,
    type: NotificationType.JOIN_REQUEST_APPROVED,
    title: 'Join Request Approved',
    message: `${hostName} has approved your request to join "${sessionTitle}"`,
    linkUrl: `/sessions/${sessionId}`,
    sessionId,
  });
}

/**
 * Notify session participants when a session is cancelled
 */
export async function notifySessionCancellation(
  userIds: string[],
  hostName: string,
  sessionId: string,
  sessionTitle: string
) {
  const notifications = [];
  
  for (const userId of userIds) {
    const notification = await createNotification({
      userId,
      type: NotificationType.SESSION_CANCELLED,
      title: 'Session Cancelled',
      message: `"${sessionTitle}" has been cancelled by ${hostName}`,
      linkUrl: `/sessions`,
      sessionId,
    });
    notifications.push(notification);
  }
  
  return notifications;
}

/**
 * Notify session participants when a session is completed
 */
export async function notifySessionCompletion(
  userIds: string[],
  sessionId: string,
  sessionTitle: string
) {
  const notifications = [];
  
  for (const userId of userIds) {
    const notification = await createNotification({
      userId,
      type: NotificationType.SESSION_COMPLETED,
      title: 'Session Completed',
      message: `"${sessionTitle}" has ended. Please rate the other participants!`,
      linkUrl: `/sessions/${sessionId}/review`,
      sessionId,
    });
    notifications.push(notification);
  }
  
  return notifications;
}

/**
 * Mark notifications as read for a user
 */
export async function markNotificationsAsRead(
  userId: string,
  notificationIds?: string[]
) {
  try {
    if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          userId,
          id: { in: notificationIds },
        },
        data: {
          isRead: true,
        },
      });
    } else {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    }
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
} 