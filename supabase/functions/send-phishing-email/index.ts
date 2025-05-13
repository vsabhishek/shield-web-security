
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

    const { to, subject, html, token, campaignId } = await req.json() as EmailRequest;
    
    // Validate required fields
    if (!to || !subject || !html || !token || !campaignId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get email credentials from environment variables
    const smtpHost = Deno.env.get('SMTP_HOST') || '';
    const smtpPort = Number(Deno.env.get('SMTP_PORT')) || 587;
    const smtpUser = Deno.env.get('SMTP_USER') || '';
    const smtpPassword = Deno.env.get('SMTP_PASSWORD') || '';
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'security-training@example.com';
    
    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.error('Email configuration not set');
      return new Response(JSON.stringify({ error: 'Email configuration not set' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Create tracking URL - replace with your actual domain or Netlify/Vercel URL
    const trackingDomain = Deno.env.get('PUBLIC_TRACKING_DOMAIN') || 'https://your-domain.com';
    const trackingUrl = `${trackingDomain}/track/${token}`;
    console.log(`Generated tracking URL: ${trackingUrl}`);

    // Replace placeholders in HTML
    const finalHtml = html.replace(/\[TRACKING_URL\]/g, trackingUrl);

    // Create SMTP client
    const client = new SmtpClient();
    
    console.log(`Connecting to SMTP: ${smtpHost}:${smtpPort}`);
    await client.connectTLS({
      hostname: smtpHost,
      port: smtpPort,
      username: smtpUser,
      password: smtpPassword,
    });

    // Send email
    console.log(`Sending email to: ${to}`);
    await client.send({
      from: fromEmail,
      to: to,
      subject: subject,
      html: finalHtml,
    });

    await client.close();
    console.log(`Email sent successfully to: ${to}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
