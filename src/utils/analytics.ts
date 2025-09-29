import { analytics } from '../firebase';
import { logEvent } from 'firebase/analytics';

// Track page views
export const trackPageView = (pageName: string) => {
  if (analytics) {
    logEvent(analytics, 'page_view', {
      page_title: pageName,
      page_location: window.location.href,
      timestamp: new Date().toISOString()
    });
  }
};

// Track CSV upload
export const trackCsvUpload = (fileName: string, fileSize: number) => {
  if (analytics) {
    logEvent(analytics, 'csv_upload', {
      file_name: fileName,
      file_size: fileSize,
      timestamp: new Date().toISOString()
    });
  }
};

// Track CSV processing
export const trackCsvProcessing = (matchedCount: number, unmatchedCount: number) => {
  if (analytics) {
    logEvent(analytics, 'csv_processing', {
      matched_count: matchedCount,
      unmatched_count: unmatchedCount,
      timestamp: new Date().toISOString()
    });
  }
};

// Track report generation
export const trackReportGeneration = (batchCode: string, presentCount: number, absentCount: number) => {
  if (analytics) {
    logEvent(analytics, 'report_generation', {
      batch_code: batchCode,
      present_count: presentCount,
      absent_count: absentCount,
      timestamp: new Date().toISOString()
    });
  }
};

// Track WhatsApp sharing
export const trackWhatsAppShare = (batchCode: string) => {
  if (analytics) {
    logEvent(analytics, 'whatsapp_share', {
      batch_code: batchCode,
      timestamp: new Date().toISOString()
    });
  }
};

// Track app usage (general)
export const trackAppUsage = (action: string, details?: Record<string, any>) => {
  if (analytics) {
    logEvent(analytics, 'app_usage', {
      action,
      ...details,
      timestamp: new Date().toISOString()
    });
  }
};
