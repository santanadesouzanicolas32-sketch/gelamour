import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { participacao_id, telefone } = await req.json() as { participacao_id: number; telefone: string };

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar participação
    const { data: part, error: partErr } = await supabase
      .from('roleta_participacoes')
      .select('*')
      .eq('id', participacao_id)
      .eq('telefone', telefone)
      .eq('status', 'aprovado')
      .eq('ja_girou', false)
      .single();

    if (partErr || !part) {
      return new Response(JSON.stringify({ error: 'Participação inválida ou já usada' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar limite semanal
    const semana = getSemanaAtual();
    const { data: vencedores } = await supabase
      .from('roleta_vencedores')
      .select('id')
      .eq('semana', semana);

    const { data: config } = await supabase
      .from('roleta_config')
      .select('premios, max_vencedores_semana')
      .eq('id', 1)
      .single();

    const maxVencedores = config?.max_vencedores_semana ?? 1;
    const premios: string[] = config?.premios ?? [];

    if ((vencedores?.length ?? 0) >= maxVencedores) {
      // Retorna prêmio de consolação (último da lista)
      const premioConsolacao = premios[premios.length - 1] ?? 'Tente novamente na próxima semana!';
      return new Response(JSON.stringify({ premio: premioConsolacao, consolacao: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Sortear no servidor
    const indice = Math.floor(Math.random() * premios.length);
    const premio = premios[indice]!;

    // Salvar resultado
    await supabase
      .from('roleta_participacoes')
      .update({ ja_girou: true, premio })
      .eq('id', participacao_id);

    await supabase
      .from('roleta_vencedores')
      .insert({ telefone, premio, semana, participacao_id });

    return new Response(JSON.stringify({ premio, indice, consolacao: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function getSemanaAtual(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const weekNum = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}
