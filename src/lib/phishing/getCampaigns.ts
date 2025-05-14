
import { supabase } from '../supabase';
import { PhishingCampaign } from './types';

// Function to get all campaigns with stats
export const getPhishingCampaigns = async (): Promise<PhishingCampaign[]> => {
  try {
    const { data: campaigns, error: campaignsError } = await supabase
      .from('phishing_campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (campaignsError) throw campaignsError;
    
    // Get recipient stats for each campaign
    const campaignsWithStats = await Promise.all(campaigns.map(async (campaign) => {
      const { data: recipients, error: recipientsError } = await supabase
        .from('phishing_recipients')
        .select('*')
        .eq('campaign_id', campaign.id);
      
      if (recipientsError) throw recipientsError;
      
      const totalSent = recipients.length;
      const clickedCount = recipients.filter(r => r.clicked).length;
      const clickRate = totalSent > 0 ? (clickedCount / totalSent) * 100 : 0;
      
      return {
        ...campaign,
        total_sent: totalSent,
        clicked_count: clickedCount,
        click_rate: clickRate
      };
    }));
    
    return campaignsWithStats;
  } catch (error) {
    console.error('Error fetching phishing campaigns:', error);
    return [];
  }
};
