/**
 * Content Reports System - App Store Guideline 1.2 Compliance
 *
 * Stores user reports and blocked user notifications in Supabase
 * for developer review and moderation.
 *
 * Reports are stored in the content_reports table and email notifications
 * are sent to the developer via Supabase Edge Function.
 */

import { supabase } from './supabase';
import type { ViolationType, ContentType } from './contentModeration';

// Developer email for report notifications - UPDATE THIS TO YOUR EMAIL
const DEVELOPER_EMAIL = 'diasporaapp.app@gmail.com';

export interface ContentReport {
  id?: string;
  reporter_id: string;
  reported_user_id: string;
  reported_user_name: string;
  content_type: ContentType | 'user';
  content_id: string | null;
  reason: ViolationType | 'blocked';
  description: string | null;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  created_at?: string;
}

/**
 * Send email notification to developer about new report
 * Uses Supabase Edge Function for email delivery
 */
async function sendReportNotificationEmail(report: Omit<ContentReport, 'id' | 'created_at' | 'status'>): Promise<void> {
  try {
    // Call the Supabase Edge Function for sending email
    const { error } = await supabase.functions.invoke('send-report-notification', {
      body: {
        to: DEVELOPER_EMAIL,
        subject: `[URGENT] User Report: ${report.reason === 'blocked' ? 'User Blocked' : report.reason}`,
        reporterUserId: report.reporter_id,
        reportedUserId: report.reported_user_id,
        reportedUserName: report.reported_user_name,
        contentType: report.content_type,
        contentId: report.content_id,
        reason: report.reason,
        description: report.description,
        timestamp: new Date().toISOString(),
      },
    });

    if (error) {
      console.log('[Report] Email notification failed (Edge Function may not exist):', error.message);
      // Fallback: Log to console so it appears in Expo logs
      console.log('[REPORT NOTIFICATION - CHECK SUPABASE DASHBOARD]');
      console.log('========================================');
      console.log(`Reported User: ${report.reported_user_name} (${report.reported_user_id})`);
      console.log(`Reason: ${report.reason}`);
      console.log(`Content Type: ${report.content_type}`);
      console.log(`Description: ${report.description || 'N/A'}`);
      console.log(`Reporter ID: ${report.reporter_id}`);
      console.log(`Time: ${new Date().toISOString()}`);
      console.log('========================================');
    } else {
      console.log('[Report] Email notification sent to developer');
    }
  } catch (err) {
    console.log('[Report] Email notification error:', err);
  }
}

/**
 * Submit a content report to Supabase
 */
export async function submitReport(report: Omit<ContentReport, 'id' | 'created_at' | 'status'>): Promise<boolean> {
  try {
    // Try to insert into Supabase
    const { error } = await supabase
      .from('content_reports')
      .insert({
        ...report,
        status: 'pending',
      });

    if (error) {
      // If table doesn't exist, log locally (for development)
      console.log('[Report] Supabase error (table may not exist):', error.message);
      console.log('[Report] Report data:', JSON.stringify(report, null, 2));
    } else {
      console.log('[Report] Successfully submitted to database');
    }

    // Always try to send email notification (even if DB insert fails)
    await sendReportNotificationEmail(report);

    return true;
  } catch (err) {
    console.log('[Report] Error submitting report:', err);
    console.log('[Report] Report data:', JSON.stringify(report, null, 2));

    // Still try to send email
    await sendReportNotificationEmail(report);

    return true; // Log locally even if submission fails
  }
}

/**
 * Report a post
 */
export async function reportPost(
  reporterId: string,
  postAuthorId: string,
  postAuthorName: string,
  postId: string,
  reason: ViolationType,
  description?: string
): Promise<boolean> {
  console.log(`[Report] Post ${postId} reported by ${reporterId} for: ${reason}`);

  return submitReport({
    reporter_id: reporterId,
    reported_user_id: postAuthorId,
    reported_user_name: postAuthorName,
    content_type: 'text',
    content_id: postId,
    reason,
    description: description || null,
  });
}

/**
 * Report a user (when blocking)
 */
export async function reportBlockedUser(
  reporterId: string,
  blockedUserId: string,
  blockedUserName: string
): Promise<boolean> {
  console.log(`[Report] User ${blockedUserId} (${blockedUserName}) blocked and reported by ${reporterId}`);

  return submitReport({
    reporter_id: reporterId,
    reported_user_id: blockedUserId,
    reported_user_name: blockedUserName,
    content_type: 'user',
    content_id: null,
    reason: 'blocked',
    description: 'User was blocked by another user - requires moderation review',
  });
}

/**
 * Report a comment
 */
export async function reportComment(
  reporterId: string,
  commentAuthorId: string,
  commentAuthorName: string,
  commentId: string,
  postId: string,
  reason: ViolationType,
  description?: string
): Promise<boolean> {
  console.log(`[Report] Comment ${commentId} reported by ${reporterId} for: ${reason}`);

  return submitReport({
    reporter_id: reporterId,
    reported_user_id: commentAuthorId,
    reported_user_name: commentAuthorName,
    content_type: 'text',
    content_id: commentId,
    reason,
    description: description || `Comment on post ${postId}`,
  });
}

/**
 * Get all pending reports (for admin review)
 */
export async function getPendingReports(): Promise<ContentReport[]> {
  try {
    const { data, error } = await supabase
      .from('content_reports')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('[Report] Error fetching reports:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.log('[Report] Error fetching reports:', err);
    return [];
  }
}

/**
 * Update report status (for admin actions)
 */
export async function updateReportStatus(
  reportId: string,
  status: 'reviewed' | 'action_taken' | 'dismissed'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('content_reports')
      .update({ status })
      .eq('id', reportId);

    if (error) {
      console.log('[Report] Error updating report status:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.log('[Report] Error updating report status:', err);
    return false;
  }
}
