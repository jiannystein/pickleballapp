import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

// Define activity types as enum for better type safety
export enum ActivityType {
  SIGN_IN = 'SIGN_IN',
  SIGN_UP = 'SIGN_UP',
  SIGN_OUT = 'SIGN_OUT',
  CREATE_SESSION = 'CREATE_SESSION',
  JOIN_SESSION = 'JOIN_SESSION',
  REQUEST_JOIN_SESSION = 'REQUEST_JOIN_SESSION',
  APPROVE_JOIN_REQUEST = 'APPROVE_JOIN_REQUEST',
  REJECT_JOIN_REQUEST = 'REJECT_JOIN_REQUEST',
  LEAVE_SESSION = 'LEAVE_SESSION',
  CANCEL_SESSION = 'CANCEL_SESSION',
  COMPLETE_SESSION = 'COMPLETE_SESSION',
  UPDATE_SESSION = 'UPDATE_SESSION',
  ADD_REVIEW = 'ADD_REVIEW',
  UPDATE_PROFILE = 'UPDATE_PROFILE',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

/**
 * Log a user activity in the database
 * @param userId - The ID of the user performing the activity
 * @param activityType - The type of activity from ActivityType enum
 * @param request - (Optional) The request object to extract IP and user agent
 * @param ipAddressOverride - (Optional) Override for IP address when request headers aren't available
 * @param userAgentOverride - (Optional) Override for user agent when request headers aren't available
 */
export async function logUserActivity(
  userId: string,
  activityType: ActivityType,
  request?: Request,
  ipAddressOverride?: string,
  userAgentOverride?: string
) {
  try {
    // Get IP and user agent from request headers if available
    let ipAddress = ipAddressOverride || '';
    let userAgent = userAgentOverride || '';

    if (request) {
      const headersList = headers();
      userAgent = headersList.get('user-agent') || request.headers.get('user-agent') || '';
      ipAddress = headersList.get('x-forwarded-for') || request.headers.get('x-forwarded-for') || '';
      
      // Clean up IP address (get only the client IP if there are multiple)
      ipAddress = ipAddress.split(',')[0].trim();
    }

    // Create the activity record
    await prisma.userActivity.create({
      data: {
        userId,
        activityType,
        ipAddress,
        userAgent
      }
    });

    console.log(`User activity logged - User: ${userId}, Activity: ${activityType}`);
  } catch (error) {
    console.error('Error logging user activity:', error);
    // Don't throw error - logging should not interrupt the main flow
  }
} 