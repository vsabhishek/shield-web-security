
// Types for phishing campaigns
export type PhishingCampaign = {
  id: string;
  title: string;
  subject: string;
  body: string;
  created_at: string;
  total_sent?: number;
  clicked_count?: number;
  click_rate?: number;
};

export type PhishingRecipient = {
  id: string;
  campaign_id: string;
  email: string;
  token: string;
  clicked: boolean;
  clicked_at: string | null;
  created_at: string;
};

export type CreateCampaignResult = {
  success: boolean;
  campaign?: PhishingCampaign;
  message?: string;
  errors?: string[];
  error?: any;
};
