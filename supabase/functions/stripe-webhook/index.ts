import Stripe from 'npm:stripe@14';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from 'npm:resend@3';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const resend = new Resend(Deno.env.get('RESEND_API_KEY')!);

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response('ok', { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const email = session.customer_details?.email;

  if (!email) {
    console.error('No email in session:', session.id);
    return new Response('No customer email', { status: 400 });
  }

  const token = crypto.randomUUID();
  const siteUrl = Deno.env.get('SITE_URL') ?? 'https://tizhad.com';
  const downloadUrl = `${siteUrl}/download?token=${token}`;

  const { error: dbError } = await supabase.from('purchases').insert({
    email,
    stripe_session_id: session.id,
    download_token: token,
  });

  if (dbError) {
    console.error('DB insert error:', dbError);
    return new Response('Database error', { status: 500 });
  }

  const { error: emailError } = await resend.emails.send({
    from: 'Tina <hello@tizhad.com>',
    to: email,
    subject: 'Your Angular 21 SaaS Starter Kit',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F9F7F4; margin: 0; padding: 40px 20px;">
          <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px; border: 1px solid #EAE6E0;">
            <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #6C5CE7, #FF5F87); display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
            </div>
            <h1 style="font-size: 24px; font-weight: 800; color: #1C1C3A; margin: 0 0 8px;">Thanks for your purchase!</h1>
            <p style="font-size: 15px; color: #6B6B8A; line-height: 1.65; margin: 0 0 32px;">
              Your <strong style="color: #1C1C3A;">Angular 21 SaaS Starter Kit</strong> is ready to download.
              The link below is single-use — click it and your download will start immediately.
            </p>
            <a href="${downloadUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #6C5CE7, #FF5F87); color: #fff; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 12px; padding: 14px 28px;">
              Download the starter kit
            </a>
            <p style="font-size: 13px; color: #9898B3; margin: 32px 0 0; line-height: 1.65;">
              If the button doesn't work, copy this URL into your browser:<br/>
              <span style="color: #6C5CE7; word-break: break-all;">${downloadUrl}</span>
            </p>
            <hr style="border: none; border-top: 1px solid #EAE6E0; margin: 32px 0;" />
            <p style="font-size: 13px; color: #9898B3; margin: 0; line-height: 1.65;">
              Questions? Just reply to this email. — Tina
            </p>
          </div>
        </body>
      </html>
    `,
  });

  if (emailError) {
    console.error('Email send error:', emailError);
    // Don't fail the webhook — purchase is recorded, email can be resent manually
  }

  return new Response('ok', { status: 200 });
});
