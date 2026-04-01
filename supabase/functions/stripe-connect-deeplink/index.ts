/**
 * HTTPS page Stripe redirects to after Connect onboarding.
 * Stripe rejects vibecode:// / exp:// as return_url — this serves HTML that opens the app.
 *
 * URL: .../stripe-connect-deeplink?d=<urlencoded deep link>
 * If ?d= is missing, falls back to APP_DEEP_LINK_SCHEME + APP_DEEP_LINK_PATH.
 *
 * Deploy with JWT verification OFF (browser has no Supabase JWT):
 *   supabase functions deploy stripe-connect-deeplink --no-verify-jwt
 */
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

function htmlForDeepLink(deepLink: string): string {
  const asJson = JSON.stringify(deepLink);
  const href = deepLink.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Return to app</title>
  <script>
    function go() {
      var target = ${asJson};
      window.location.replace(target);
      setTimeout(function () {
        var el = document.getElementById('fallback');
        if (el) el.style.display = 'block';
      }, 800);
    }
  </script>
</head>
<body onload="go()" style="font-family: system-ui; padding: 24px; text-align: center;">
  <p>Returning to the app…</p>
  <p id="fallback" style="display: none; margin-top: 24px;">
    <a href="${href}">Tap here to open the app</a>
  </p>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  let deepLink: string;
  try {
    const url = new URL(req.url);
    const d = url.searchParams.get('d');
    if (d) {
      deepLink = decodeURIComponent(d);
    } else {
      const scheme = (Deno.env.get('APP_DEEP_LINK_SCHEME') || 'vibecode').replace(/[^a-z0-9-]/gi, '');
      const path = (Deno.env.get('APP_DEEP_LINK_PATH') || 'stripe-connect-return').replace(/^\/+/, '');
      deepLink = `${scheme}://${path}`;
    }
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const allowedScheme = (Deno.env.get('APP_DEEP_LINK_SCHEME') || 'vibecode').toLowerCase();
  const lower = deepLink.toLowerCase();
  if (!lower.startsWith(`${allowedScheme}://`)) {
    return new Response('Invalid redirect target', { status: 400 });
  }

  return new Response(htmlForDeepLink(deepLink), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
});
