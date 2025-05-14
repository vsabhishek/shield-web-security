
import { supabase } from '../supabase';
import { PhishingCampaign, PhishingRecipient } from './types';

// Function to get campaign details with recipients
export const getPhishingCampaignDetails = async (campaignId: string): Promise<{ 
  campaign: PhishingCampaign | null, 
  recipients: PhishingRecipient[] 
}> => {
  try {
    const { data: campaign, error: campaignError } = await supabase
      .from('phishing_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    
    if (campaignError) throw campaignError;
    
    const { data: recipients, error: recipientsError } = await supabase
      .from('phishing_recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true });
    
    if (recipientsError) throw recipientsError;
    
    const clickedCount = recipients.filter(r => r.clicked).length;
    const clickRate = recipients.length > 0 ? (clickedCount / recipients.length) * 100 : 0;
    
    return { 
      campaign: {
        ...campaign,
        total_sent: recipients.length,
        clicked_count: clickedCount,
        click_rate: clickRate
      }, 
      recipients 
    };
  } catch (error) {
    console.error('Error fetching campaign details:', error);
    return { campaign: null, recipients: [] };
  }
};
