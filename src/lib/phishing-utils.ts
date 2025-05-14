
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

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

// Function to create a new campaign
export const createPhishingCampaign = async (
  title: string,
  subject: string,
  body: string,
  emails: string[]
) => {
  try {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User must be logged in to create campaigns');
    }

    console.log("Creating phishing campaign with user_id:", session.user.id);
    
    // Create campaign with user_id
    const { data: campaign, error: campaignError } = await supabase
      .from('phishing_campaigns')
      .insert({
        title,
        subject,
        body,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (campaignError) {
      console.error("Campaign creation error:", campaignError);
      throw campaignError;
    }
    
    console.log("Campaign created successfully:", campaign);
    
    // Add recipients
    const recipients = emails.map(email => ({
      campaign_id: campaign.id,
      email,
      token: uuidv4()
    }));

    const { error: recipientsError } = await supabase
      .from('phishing_recipients')
      .insert(recipients);
      
    if (recipientsError) {
      console.error("Recipients creation error:", recipientsError);
      throw recipientsError;
    }

    console.log("Recipients created successfully:", recipients.length);

    // Send emails to each recipient
    let successCount = 0;
    let errorCount = 0;
    
    for (const recipient of recipients) {
      console.log(`Sending email to ${recipient.email} with token ${recipient.token}`);
      
      try {
        const result = await supabase.functions.invoke('send-phishing-email', {
          body: {
            to: recipient.email,
            subject,
            html: body,
            token: recipient.token,
            campaignId: campaign.id
          }
        });
        
        console.log("Email sending result:", result);
        
        if (result.error) {
          console.error(`Error sending to ${recipient.email}:`, result.error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`Error sending email to ${recipient.email}:`, err);
        errorCount++;
      }
    }

    console.log(`Email sending complete. Success: ${successCount}, Failed: ${errorCount}`);
    
    if (errorCount > 0) {
      return { 
        success: successCount > 0, 
        campaign,
        message: `${successCount} email(s) sent successfully, ${errorCount} failed.` 
      };
    }
    
    return { success: true, campaign };
  } catch (error) {
    console.error('Error creating phishing campaign:', error);
    return { success: false, error };
  }
};

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

// Function to get campaign details with recipients
export const getPhishingCampaignDetails = async (campaignId: string) => {
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
