import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with actual values
const supabaseUrl = 'https://bjzqfmmowlghbmsyigwm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqenFmbW1vd2xnaGJtc3lpZ3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMjAwMzgsImV4cCI6MjA2MjY5NjAzOH0.4cf7hnJ5yGIU8LR58YV2w1g8ESz0ywRppYF2lagOxOA';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage
  }
});

// These mock functions remain the same for features that would be implemented later
export const mockScanVulnerabilities = async (target: string, scanType: string): Promise<any> => {
  // Simulating API response
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    status: 'completed',
    target: target,
    scan_type: scanType,
    timestamp: new Date().toISOString(),
    results: [
      { severity: 'high', title: 'CVE-2023-1234', description: 'Outdated OpenSSL version detected', port: '443' },
      { severity: 'medium', title: 'Open SSH Port', description: 'SSH service running on default port', port: '22' },
      { severity: 'low', title: 'HTTP Server Information Disclosure', description: 'HTTP server version is visible in headers', port: '80' },
    ]
  };
};

export const mockCheckPassword = async (password: string): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Calculate a score based on password length and complexity
  const length = password.length;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecials = /[^A-Za-z0-9]/.test(password);
  
  const totalChecks = [hasUppercase, hasLowercase, hasNumbers, hasSpecials].filter(Boolean).length;
  let score = Math.min(100, Math.max(0, length * 5 + totalChecks * 10));
  
  return {
    score: score,
    breached: password === 'password123', // Mock breach check
    suggestions: score < 70 ? [
      'Use a longer password',
      'Include special characters',
      'Mix uppercase and lowercase',
      'Add numbers'
    ] : []
  };
};

export const mockSendPhishingCampaign = async (campaign: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    id: `campaign_${Math.floor(Math.random() * 1000)}`,
    status: 'scheduled',
    sent_time: new Date().toISOString(),
    targets: campaign.targets,
    template: campaign.template
  };
};

export const mockScanPorts = async (target: string, ports: number[]): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const results = ports.map(port => {
    const isOpen = Math.random() > 0.7;
    let service = '';
    
    switch(port) {
      case 22: service = 'SSH'; break;
      case 80: service = 'HTTP'; break;
      case 443: service = 'HTTPS'; break;
      case 3306: service = 'MySQL'; break;
      case 5432: service = 'PostgreSQL'; break;
      default: service = isOpen ? 'Unknown' : '';
    }
    
    return {
      port,
      status: isOpen ? 'open' : 'closed',
      service: isOpen ? service : ''
    };
  });
  
  return {
    target,
    timestamp: new Date().toISOString(),
    results
  };
};
