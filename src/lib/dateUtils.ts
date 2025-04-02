import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Formats a date string into a localized date display
 * @param dateString ISO date string
 * @returns Formatted date string in user's local timezone
 */
export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Formats a date string into a localized time display
 * @param dateString ISO date string
 * @returns Formatted time string in user's local timezone
 */
export function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString(undefined, { 
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Formats a date string into a localized date and time object
 * @param dateString ISO date string
 * @returns Object with formatted date and time strings
 */
export function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return {
    date: formatDate(dateString),
    time: formatTime(dateString)
  };
}

/**
 * Preserves the local date/time when creating a Date object from form inputs
 * This helps ensure the date chosen in the datepicker is the same date stored in the database
 * By explicitly keeping the hours, minutes and seconds the same regardless of timezone
 * 
 * @param localDate Local date object from date picker
 * @returns ISO string that preserves the local date/time selection
 * @deprecated Use createLocalISOString instead for better timezone handling
 */
export function preserveLocalDateTime(localDate: Date): string {
  if (!localDate) return '';
  
  // Create a new date object that will be transmitted to the server
  // This preserves exactly what the user selected regardless of timezone
  const year = localDate.getFullYear();
  const month = localDate.getMonth();
  const day = localDate.getDate();
  const hours = localDate.getHours();
  const minutes = localDate.getMinutes();
  const seconds = localDate.getSeconds();
  
  // Create a new UTC date with the same local time components
  const utcDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
  
  return utcDate.toISOString();
}

/**
 * Creates an ISO string from a date object, accounting for timezone offset
 * to ensure the date/time appears exactly as selected in the UI
 * 
 * @param date Date object from the date picker
 * @returns ISO string with timezone correction
 */
export function createLocalISOString(date: Date): string {
  if (!date) return '';
  
  // Get timezone offset in minutes (positive for locations west of UTC)
  const timezoneOffsetMinutes = date.getTimezoneOffset();
  
  // Create a new date object with the timezone offset ADDED to compensate
  // This ensures when it's converted back from UTC to local time, it'll show the correct time
  const correctedDate = new Date(date.getTime() + (timezoneOffsetMinutes * 60 * 1000));
  
  // Return ISO string
  return correctedDate.toISOString();
}

/**
 * Checks if a session has ended based on its date and duration
 * @param session Object containing date (string) and duration (minutes)
 * @returns Boolean indicating if the session has ended
 */
export function isSessionEnded(session: any): boolean {
  // Handle case where session is undefined or null
  if (!session) return false;

  // Get the date value (handling both string and Date objects)
  let startTime: Date;
  if (typeof session.date === 'string') {
    startTime = new Date(session.date);
  } else if (session.date instanceof Date) {
    startTime = session.date;
  } else {
    console.error('Invalid date format in session:', session.date);
    return false; // Return false if we can't determine the date
  }

  // Use default duration of 60 minutes if not specified
  const durationMinutes = typeof session.duration === 'number' ? session.duration : 60;
  
  // Calculate end time by adding duration in milliseconds
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  
  // Session has ended if end time is in the past
  return endTime < new Date();
} 