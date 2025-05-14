
import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import { PhishingCampaign, CreateCampaignResult } from './types';

// Function to create a new campaign
export const createPhishingCampaign = async (
  title: string,
  subject: string,
  body: string,
  emails: string[]
): Promise<CreateCampaignResult> => {
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
    let errorMessages = [];
    
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
          errorMessages.push(`${recipient.email}: ${result.error}`);
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`Error sending email to ${recipient.email}:`, err);
        errorCount++;
        errorMessages.push(`${recipient.email}: ${err.message}`);
      }
    }

    console.log(`Email sending complete. Success: ${successCount}, Failed: ${errorCount}`);
    
    if (errorCount > 0) {
      return { 
        success: successCount > 0, 
        campaign,
        message: `${successCount} email(s) sent successfully, ${errorCount} failed.`,
        errors: errorMessages
      };
    }
    
    return { success: true, campaign };
  } catch (error) {
    console.error('Error creating phishing campaign:', error);
    return { success: false, error };
  }
};
