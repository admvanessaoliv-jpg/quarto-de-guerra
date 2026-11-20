import { createClient } from 'npm:@supabase/supabase-js@2';
const APP_URL = 'https://appquartodeguerra.com/';
function chaveSecreta(): string {
  const k = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (k) return k;
  try { const j = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}'); return j.default ?? Object.values(j)[0] ?? ''; } catch { return ''; }
}
Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get('token') !== Deno.env.get('KIWIFY_TOKEN')) return new Response('nao autorizado', { status: 401 });
    let body: any = {};
    try { body = await req.json(); } catch { return new Response('json invalido', { status: 400 }); }
    const email = String(body?.Customer?.email ?? body?.customer?.email ?? '').trim().toLowerCase();
    if (!email) return new Response('sem email', { status: 200 });
    const evento = String(body?.webhook_event_type ?? '').toLowerCase();
    const pedido = String(body?.order_status ?? '').toLowerCase();
    const assinatura = String(body?.Subscription?.status ?? '').toLowerCase();
    let status: string | null = null;
    if (['order_approved','subscription_renewed'].includes(evento) || ['paid','approved'].includes(pedido)) status = 'ativa';
    if (evento === 'subscription_late' || ['late','overdue'].includes(assinatura)) status = 'atrasada';
    if (['subscription_canceled','order_refunded','chargeback','order_chargeback'].includes(evento) || ['refunded','chargedback','canceled'].includes(pedido) || assinatura === 'canceled') status = 'cancelada';
    console.log('kiwify', email, evento, pedido, assinatura, '->', status);
    if (!status) return new Response('evento ignorado', { status: 200 });
    const chave = chaveSecreta();
    if (!chave) { console.error('sem chave secreta'); return new Response('sem chave secreta', { status: 500 }); }
    const sb = createClient(Deno.env.get('SUPABASE_URL') ?? '', chave, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await sb.from('assinantes').upsert({ email, status, pedido_kiwify: String(body?.order_id ?? ''), atualizado: new Date().toISOString() });
    if (error) { console.error('erro ao salvar', error.message); return new Response('erro ao salvar: ' + error.message, { status: 500 }); }
    if (status === 'ativa') {
      const { error: e2 } = await sb.auth.admin.inviteUserByEmail(email, { redirectTo: APP_URL });
      if (e2) console.error('convite', e2.message);
      if (e2 && !/already|registered|exists/i.test(e2.message)) return new Response('liberado, convite falhou: ' + e2.message, { status: 200 });
    }
    return new Response('ok: ' + email + ' ' + status, { status: 200 });
  } catch (e) {
    console.error('erro geral', String(e));
    return new Response('erro: ' + String(e), { status: 500 });
  }
});
