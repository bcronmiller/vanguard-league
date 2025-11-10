// Configuration utilities for the application

export const isReadOnly = () => {
  return process.env.NEXT_PUBLIC_READ_ONLY === 'true';
};

export const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

export const config = {
  apiUrl: getApiUrl(),
  readOnly: isReadOnly(),
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Vanguard League',
  siteDescription: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'VGI Trench Submission-Only Ladder',
};
