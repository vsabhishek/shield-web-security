
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShodanLookupRequest {
  target: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { target }: ShodanLookupRequest = await req.json()
    
    console.log(`Performing Shodan lookup for ${target}`)
    
    const shodanApiKey = Deno.env.get('SHODAN_API_KEY')
    
    if (!shodanApiKey) {
      return new Response(
        JSON.stringify({ error: 'Shodan API key not configured' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Query Shodan API for host information
    const shodanResponse = await fetch(`https://api.shodan.io/shodan/host/${target}?key=${shodanApiKey}`)
    
    if (!shodanResponse.ok) {
      if (shodanResponse.status === 404) {
        return new Response(
          JSON.stringify({ 
            message: 'No Shodan data available for this target',
            open_ports: [],
            vulns: []
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      throw new Error(`Shodan API error: ${shodanResponse.status}`)
    }

    const shodanData = await shodanResponse.json()
    
    // Extract relevant information
    const result = {
      ip: shodanData.ip_str,
      hostnames: shodanData.hostnames || [],
      open_ports: shodanData.ports || [],
      organization: shodanData.org,
      country: shodanData.country_name,
      city: shodanData.city,
      vulns: Object.keys(shodanData.vulns || {}),
      services: shodanData.data?.map((service: any) => ({
        port: service.port,
        product: service.product,
        version: service.version,
        banner: service.banner?.substring(0, 200) // Limit banner length
      })) || [],
      last_update: shodanData.last_update
    }

    console.log(`Shodan lookup successful: ${result.open_ports.length} ports found`)

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Shodan lookup error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
