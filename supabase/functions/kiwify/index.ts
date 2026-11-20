// Quarto de Guerra — recebe os avisos da Kiwify e libera ou bloqueia o acesso.
// Supabase > Edge Functions > nome: kiwify. Desligar "Verify JWT". Secret: KIWIFY_TOKEN.
import { createClient } from 'npm:@supabase/supabase-js@2';

const APP_URL = 'https://admvanessaoliv-jpg.github.io/quarto-de-guerra/';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.get('token') !== Deno.env.get('KIWIFY_TOKEN')) {
    return new Response('nao autorizado', { status: 401 });
  }
  let body: any = {};
  try { body = await req.json(); } catch { return new Response('json invalido', { status: 400 }); }

  const email = String(body?.Customer?.email ?? body?.customer?.email ?? '').trim().toLowerCase();
  if (!email) return new Response('sem email', { status: 200 });

  const evento = String(body?.webhook_event_type ?? '').toLowerCase();
  const pedido = String(body?.order_status ?? '').toLowerCase();
  const assinatura = String(body?.Subscription?.status ?? '').toLowerCase();

  let status: string | null = null;
  if (['order_approved', 'subscription_renewed'].includes(evento) || ['paid', 'approved'].includes(pedido)) status = 'ativa';
  if (evento === 'subscription_late' || ['late', 'overdue'].includes(assinatura)) status = 'atrasada';
  if (['subscription_canceled', 'order_refunded', 'chargeback', 'order_chargeback'].includes(evento) ||
      ['refunded', 'chargedback', 'canceled'].includes(pedido) || assinatura === 'canceled') status = 'cancelada';
  if (!status) return new Response('evento ignorado', { status: 200 });

  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const sb = createClient(Deno.env.get('SUPABASE_URL') ?? '', key, { auth: { persistSession: false } });

  const { error } = await sb.from('assinantes').upsert({
    email, status, pedido_kiwify: String(body?.order_id ?? ''), atualizado: new Date().toISOString(),
  });
  if (error) return new Response('erro ao salvar: ' + error.message, { status: 500 });

  if (status === 'ativa') {
    // Envia o convite para criar a senha. Se ela já tem conta, o Supabase avisa e seguimos normalmente.
    const { error: e2 } = await sb.auth.admin.inviteUserByEmail(email, { redirectTo: APP_URL });
    if (e2 && !/already|registered|exists/i.test(e2.message)) {
      return new Response('acesso liberado, mas o convite falhou: ' + e2.message, { status: 200 });
    }
  }
  return new Response('ok: ' + email + ' ' + status, { status: 200 });
});
