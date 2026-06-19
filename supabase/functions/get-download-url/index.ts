import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const ALLOWED_ORIGINS = ['https://tizhad.com', 'http://localhost:4200'];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = ALLOWED_ORIGINS.includes(origin ?? '') ? origin! : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function json(data: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  let token: string | undefined;
  try {
    const body = await req.json();
    token = body.token;
  } catch {
    return json({ error: 'Invalid request body' }, 400, origin);
  }

  if (!token) {
    return json({ error: 'Missing token' }, 400, origin);
  }

  const { data: purchase, error: fetchError } = await supabase
    .from('purchases')
    .select('id, token_used')
    .eq('download_token', token)
    .single();

  if (fetchError || !purchase) {
    return json({ error: 'Invalid download link.' }, 404, origin);
  }

  if (purchase.token_used) {
    return json(
      { error: 'This download link has already been used. Reply to your purchase email to get a new one.' },
      410,
      origin,
    );
  }

  // Mark token as used before generating the URL — prevents race conditions
  const { error: updateError } = await supabase
    .from('purchases')
    .update({ token_used: true })
    .eq('id', purchase.id);

  if (updateError) {
    console.error('Token update error:', updateError);
    return json({ error: 'Server error. Please try again.' }, 500, origin);
  }

  // Signed URL valid for 60 seconds — enough for the browser to start the download
  const { data: signed, error: signedError } = await supabase.storage
    .from('starter-kit')
    .createSignedUrl('ng21-starter-kit.zip', 60);

  if (signedError || !signed) {
    console.error('Signed URL error:', signedError);
    return json({ error: 'Could not generate download URL. Please reply to your purchase email.' }, 500, origin);
  }

  return json({ url: signed.signedUrl }, 200, origin);
});
