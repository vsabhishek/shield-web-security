
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  token: string;
  campaignId: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log("Processing email request...");
    const { to, subject, html, token, campaignId } = await req.json() as EmailRequest;
    
    // Validate required fields
    if (!to || !subject || !html || !token || !campaignId) {
      console.error("Missing required fields", { to, subject, html: !!html, token, campaignId });
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Create tracking URL - using the Lovable project URL
    const trackingDomain = "https://011f5a82-9278-49d5-8f8d-d7f35f06c5e2.lovableproject.com";
    const trackingUrl = `${trackingDomain}/track/${token}`;
    console.log(`Generated tracking URL: ${trackingUrl}`);

    // Replace placeholders in HTML
    const finalHtml = html.replace(/\[TRACKING_URL\]/g, trackingUrl);

    // Get API key from environment
    const apiKey = Deno.env.get("PHISHING_API_KEY");
    if (!apiKey) {
      console.error("API key not found in environment");
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // For debugging
    console.log(`Using API key starting with: ${apiKey.substring(0, 5)}...`);

    // Configure direct SMTP sending using Mailgun API
    const mailgunDomain = "sandbox.mailgun.org"; // Replace with your domain
    const emailApiEndpoint = `https://api.mailgun.net/v3/${mailgunDomain}/messages`;
    
    console.log(`Using Mailgun endpoint: ${emailApiEndpoint}`);
    
    // Prepare form data for email sending
    const formData = new FormData();
    formData.append("from", "Phishing Simulator <mailgun@sandbox.mailgun.org>");
    formData.append("to", to);
    formData.append("subject", subject);
    formData.append("html", finalHtml);
    
    // Log the request being sent
    console.log(`Sending email to: ${to} with subject: ${subject}`);
    
    // Send actual email using the API key
    try {
      const response = await fetch(emailApiEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`api:${apiKey}`)}`,
        },
        body: formData,
      });
      
      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.log("Response is not JSON:", responseText);
        responseData = { rawText: responseText };
      }
      
      console.log("API Response Status:", response.status);
      console.log("API Response Data:", responseData);
      
      if (!response.ok) {
        return new Response(
          JSON.stringify({ 
            error: 'Failed to send email',
            status: response.status,
            details: responseData 
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
      
      console.log("Email sent successfully:", responseData);
      
      // Return success response
      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Email sent to ${to} successfully`,
          details: responseData
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    } catch (error) {
      console.error("Error calling email API:", error);
      return new Response(
        JSON.stringify({ 
          error: 'Exception when calling email API',
          details: error.message
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
  } catch (error) {
    console.error('Error in send-phishing-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});
