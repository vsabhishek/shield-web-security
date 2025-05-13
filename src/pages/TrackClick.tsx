
import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

const TrackClick = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [redirectUrl, setRedirectUrl] = useState('');

  useEffect(() => {
    const trackClick = async () => {
      if (!token) {
        setRedirectUrl('/');
        return;
      }

      try {
        // Log the click attempt
        console.log('Processing phishing click for token:', token);
        
        // Call the track_phishing_click function
        const { data, error } = await supabase
          .rpc('track_phishing_click', { token_param: token });
        
        if (error) {
          console.error('Error tracking click:', error);
        } else {
          console.log('Click tracked successfully:', data);
        }

        // Redirect to a realistic-looking login page or other destination
        // For demonstration purposes, we're redirecting to the login page
        setRedirectUrl('/login');
      } catch (error) {
        console.error('Error:', error);
        setRedirectUrl('/');
      } finally {
        setLoading(false);
      }
    };

    trackClick();
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyber-blue" />
        <p className="ml-2">Redirecting...</p>
      </div>
    );
  }

  if (redirectUrl) {
    return <Navigate to={redirectUrl} replace />;
  }

  return null;
};

export default TrackClick;
