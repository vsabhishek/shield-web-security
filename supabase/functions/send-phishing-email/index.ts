
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

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

    // Use environment variables for SMTP configuration
    const smtpHost = "smtp.gmail.com";
    const smtpPort = 587;
    const smtpUser = "veerasivaabhishek5744@gmail.com";
    const smtpPass = "jgci gfgs xvbe zlrt"; // Updated app password
    const fromEmail = "security-training@example.com";
    
    // Create tracking URL - using the Lovable project URL
    const trackingDomain = "https://011f5a82-9278-49d5-8f8d-d7f35f06c5e2.lovableproject.com";
    const trackingUrl = `${trackingDomain}/track/${token}`;
    console.log(`Generated tracking URL: ${trackingUrl}`);

    // Replace placeholders in HTML
    const finalHtml = html.replace(/\[TRACKING_URL\]/g, trackingUrl);

    console.log(`Connecting to SMTP: ${smtpHost}:${smtpPort} with user: ${smtpUser}`);
    
    // Create SMTP client with TLS configuration
    const client = new SmtpClient();
    
    try {
      await client.connectTLS({
        hostname: smtpHost,
        port: smtpPort,
        username: smtpUser,
        password: smtpPass,
      });

      // Send email
      console.log(`Sending email to: ${to}`);
      const sendResult = await client.send({
        from: fromEmail,
        to: to,
        subject: subject,
        content: finalHtml,
        html: finalHtml,
      });
      
      console.log("Send result:", sendResult);
      await client.close();
      console.log(`Email sent successfully to: ${to}`);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (smtpError) {
      console.error("SMTP Error:", smtpError);
      return new Response(JSON.stringify({ error: `SMTP Error: ${smtpError.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
