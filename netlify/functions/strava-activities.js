const ALLOWED_ORIGINS = [
  'https://elliotlozano.github.io',
  'https://theascensionprotocol.netlify.app'
];

exports.handler = async function(event) {
  const origin = event.headers.origin || '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    const { access_token, per_page, page, activity_id } = JSON.parse(event.body || '{}');
    if (!access_token) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing access_token' }) };
    }

    let url;
    if (activity_id) {
      url = `https://www.strava.com/api/v3/activities/${activity_id}?include_all_efforts=true`;
    } else {
      const params = new URLSearchParams();
      params.set('per_page', String(per_page || 30));
      params.set('page', String(page || 1));
      url = `https://www.strava.com/api/v3/athlete/activities?${params.toString()}`;
    }

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: data.message || 'Fetch failed' })
      };
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message })
    };
  }
};
