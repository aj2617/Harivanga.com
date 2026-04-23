import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type OrderItemRow = {
  productId: string;
  productName: string;
  quantity: number;
  variant: string;
  price: number;
};

type OrderRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_area: string;
  delivery_division: string | null;
  delivery_district: string | null;
  delivery_location: string | null;
  delivery_method: string | null;
  delivery_date: string;
  payment_method: string;
  payment_status: string | null;
  subtotal: number;
  delivery_charge: number;
  total: number;
  items: OrderItemRow[];
  created_at: string;
};

type NotifyRequest = {
  orderId?: string;
};

function jsonResponse(payload: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, ...extraHeaders, 'Content-Type': 'application/json' },
  });
}

function shortOrderId(orderId: string) {
  return orderId.slice(0, 8);
}

function buildOrderText(order: OrderRow) {
  const itemLines = (Array.isArray(order.items) ? order.items : [])
    .slice(0, 20)
    .map((item) => `- ${item.productName} x${item.quantity} (${item.variant}) @ ${item.price}`)
    .join('\n');

  const locationParts = [
    order.delivery_location,
    order.delivery_district,
    order.delivery_division,
  ].filter(Boolean);

  const locationLabel = locationParts.length ? locationParts.join(', ') : 'n/a';

  return [
    `New order: ${shortOrderId(order.id)}`,
    `Customer: ${order.customer_name}`,
    `Phone: ${order.customer_phone}`,
    `Delivery: ${order.delivery_method ?? 'n/a'} | ${order.delivery_area} | ${locationLabel}`,
    `Address: ${order.delivery_address}`,
    `Delivery date: ${order.delivery_date}`,
    `Payment: ${order.payment_method} (${order.payment_status ?? 'n/a'})`,
    `Subtotal: ${order.subtotal}`,
    `Delivery charge: ${order.delivery_charge}`,
    `Total: ${order.total}`,
    '',
    'Items:',
    itemLines || '- n/a',
    '',
    `Order id: ${order.id}`,
    `Created: ${order.created_at}`,
  ].join('\n');
}

async function supabaseRest<T>(
  url: string,
  serviceRoleKey: string,
  init: RequestInit & { headers?: Record<string, string> } = {}
) {
  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  const json = text ? (JSON.parse(text) as T) : (null as T);
  return { ok: response.ok, status: response.status, json, raw: text };
}

async function sendEmailViaResend(params: { apiKey: string; from: string; to: string; subject: string; text: string }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      subject: params.subject,
      text: params.text,
    }),
  });

  const payloadText = await response.text();
  return { ok: response.ok, status: response.status, body: payloadText };
}

function createBasicAuthHeader(username: string, password: string) {
  const token = btoa(`${username}:${password}`);
  return `Basic ${token}`;
}

async function sendWhatsAppViaTwilio(params: {
  accountSid: string;
  authToken: string;
  from: string;
  to: string;
  body: string;
}) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${params.accountSid}/Messages.json`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: createBasicAuthHeader(params.accountSid, params.authToken),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: params.from.startsWith('whatsapp:') ? params.from : `whatsapp:${params.from}`,
      To: params.to.startsWith('whatsapp:') ? params.to : `whatsapp:${params.to}`,
      Body: params.body,
    }),
  });

  const payloadText = await response.text();
  return { ok: response.ok, status: response.status, body: payloadText };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(
      {
        error:
          'Missing SUPABASE_URL or service role key. Supabase usually injects SUPABASE_SERVICE_ROLE_KEY automatically. If not present, add a secret named SERVICE_ROLE_KEY.',
      },
      500
    );
  }

  let body: NotifyRequest;
  try {
    body = (await request.json()) as NotifyRequest;
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400);
  }

  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
    return jsonResponse({ error: 'A valid orderId (uuid) is required.' }, 400);
  }

  const existing = await supabaseRest<Array<{ order_id: string; email_sent: boolean; whatsapp_sent: boolean }>>(
    `${supabaseUrl}/rest/v1/order_notifications?order_id=eq.${orderId}&select=order_id,email_sent,whatsapp_sent&limit=1`,
    serviceRoleKey
  );

  if (!existing.ok) {
    return jsonResponse({ error: 'Failed to check notification status.' }, 502, { 'x-upstream-status': String(existing.status) });
  }

  if (Array.isArray(existing.json) && existing.json.length > 0) {
    const row = existing.json[0];
    if (row.email_sent || row.whatsapp_sent) {
      return jsonResponse({ ok: true, alreadyNotified: true });
    }
  }

  const orderLookup = await supabaseRest<OrderRow[]>(
    `${supabaseUrl}/rest/v1/orders?id=eq.${orderId}&select=id,customer_name,customer_phone,delivery_address,delivery_area,delivery_division,delivery_district,delivery_location,delivery_method,delivery_date,payment_method,payment_status,subtotal,delivery_charge,total,items,created_at&limit=1`,
    serviceRoleKey
  );

  if (!orderLookup.ok) {
    return jsonResponse({ error: 'Failed to load order.' }, 502, { 'x-upstream-status': String(orderLookup.status) });
  }

  const order = Array.isArray(orderLookup.json) ? orderLookup.json[0] : null;
  if (!order) {
    return jsonResponse({ error: 'Order not found.' }, 404);
  }

  const text = buildOrderText(order);
  const subject = `New order ${shortOrderId(order.id)} (Total ${order.total})`;

  const resendKey = Deno.env.get('RESEND_API_KEY');
  const notifyEmailTo = Deno.env.get('NOTIFY_ADMIN_EMAIL');
  const notifyEmailFrom = Deno.env.get('NOTIFY_EMAIL_FROM');

  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioFrom = Deno.env.get('TWILIO_WHATSAPP_FROM');
  const notifyWhatsAppTo = Deno.env.get('NOTIFY_WHATSAPP_TO');

  const results: Record<string, unknown> = {};
  let emailSent = false;
  let whatsappSent = false;

  if (resendKey && notifyEmailTo && notifyEmailFrom) {
    const emailResult = await sendEmailViaResend({
      apiKey: resendKey,
      from: notifyEmailFrom,
      to: notifyEmailTo,
      subject,
      text,
    });
    results.email = emailResult;
    emailSent = emailResult.ok;
  } else {
    results.email = { skipped: true };
  }

  if (twilioSid && twilioToken && twilioFrom && notifyWhatsAppTo) {
    const waResult = await sendWhatsAppViaTwilio({
      accountSid: twilioSid,
      authToken: twilioToken,
      from: twilioFrom,
      to: notifyWhatsAppTo,
      body: text.slice(0, 1500),
    });
    results.whatsapp = waResult;
    whatsappSent = waResult.ok;
  } else {
    results.whatsapp = { skipped: true };
  }

  if (!emailSent && !whatsappSent) {
    return jsonResponse(
      {
        ok: false,
        error: 'No notification channel is configured (or all sends failed).',
        results,
      },
      502
    );
  }

  const insert = await supabaseRest<unknown>(`${supabaseUrl}/rest/v1/order_notifications`, serviceRoleKey, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      order_id: orderId,
      email_sent: emailSent,
      whatsapp_sent: whatsappSent,
      email_to: notifyEmailTo ?? null,
      whatsapp_to: notifyWhatsAppTo ?? null,
    }),
  });

  if (!insert.ok && insert.status !== 409) {
    return jsonResponse(
      {
        ok: true,
        warning: 'Notification sent, but failed to record order_notifications row.',
        results,
      },
      200,
      { 'x-upstream-status': String(insert.status) }
    );
  }

  return jsonResponse({ ok: true, results });
});
