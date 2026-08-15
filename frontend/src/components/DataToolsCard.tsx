import { useEffect, useState } from 'react';
import { CalendarPlus, CheckCircle2, DatabaseBackup, Download, ExternalLink, Search, Unplug } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { getAiStatus, type AiStatusResponse } from '@/services/api';

async function downloadExport(format: 'json' | 'csv' | 'ics') {
  const response = await fetch(`/api/export?format=${format}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Não foi possível preparar o arquivo.');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = format === 'ics' ? 'vencimentos.ics' : `liquid-ledger.${format}`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function DataToolsCard() {
  const [message, setMessage] = useState('');
  const [research, setResearch] = useState('');
  const [results, setResults] = useState<Array<{ title: string; url: string; snippet?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiStatusResponse | null>(null);

  useEffect(() => {
    let active = true;
    getAiStatus()
      .then((status) => { if (active) setAiStatus(status); })
      .catch(() => { if (active) setAiStatus(null); });
    return () => { active = false; };
  }, []);

  const exportFile = async (format: 'json' | 'csv' | 'ics') => {
    try { await downloadExport(format); setMessage('Arquivo preparado com sucesso.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao exportar.'); }
  };

  const searchExternal = async () => {
    if (!research.trim()) return;
    setLoading(true); setMessage('');
    try {
      const response = await fetch('/api/research', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: research }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Pesquisa indisponível.');
      setResults(data.results || []);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Pesquisa indisponível.'); }
    finally { setLoading(false); }
  };

  return (
    <GlassCard className="mb-6 glass-neutral" delay={0.33}>
      <div className="flex items-start gap-3 mb-3"><span className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"><DatabaseBackup className="w-4 h-4" /></span><div><h2 className="text-headline font-semibold">Dados e integrações</h2><p className="text-caption text-muted-foreground">Backup portátil, agenda e pesquisa externa sem compartilhar seu extrato.</p></div></div>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => void exportFile('json')} className="rounded-xl border border-border/60 bg-secondary/45 p-2.5 text-caption flex flex-col items-center gap-1"><DatabaseBackup className="w-4 h-4" />Backup JSON</button>
        <button onClick={() => void exportFile('csv')} className="rounded-xl border border-border/60 bg-secondary/45 p-2.5 text-caption flex flex-col items-center gap-1"><Download className="w-4 h-4" />Planilha CSV</button>
        <button onClick={() => void exportFile('ics')} className="rounded-xl border border-border/60 bg-secondary/45 p-2.5 text-caption flex flex-col items-center gap-1"><CalendarPlus className="w-4 h-4" />Calendário</button>
      </div>
      {aiStatus && (
        <div className="mt-3 rounded-2xl border border-border/55 bg-secondary/30 p-3">
          <p className="text-caption font-semibold mb-2">Provedores de IA</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {Object.entries(aiStatus.providers).map(([name, provider]) => (
              <div
                key={name}
                title={provider.purpose}
                className="rounded-xl border border-border/45 bg-card/55 px-2 py-2 text-[10px]"
              >
                <span className="flex items-center gap-1 font-semibold capitalize">
                  {provider.enabled === false
                    ? <Unplug className="h-3.5 w-3.5 text-muted-foreground" />
                    : provider.configured
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    : <Unplug className="h-3.5 w-3.5 text-muted-foreground" />}
                  {name}
                </span>
                <span className="mt-0.5 block text-muted-foreground">
                  {provider.enabled === false ? 'Desativado' : provider.configured ? 'Ativo' : 'Sem chave'}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Modo sem cobrança: Gemini gratuito com fallback local; Perplexity abre no navegador.
          </p>
        </div>
      )}
      <div className="mt-3 flex gap-2"><label className="sr-only" htmlFor="external-research">Pesquisa financeira externa</label><input id="external-research" value={research} onChange={(event) => setResearch(event.target.value)} placeholder="Pesquisar taxa, inflação ou produto..." className="flex-1 min-w-0 rounded-xl bg-secondary/55 border border-border/60 px-3 py-2 text-caption outline-none" /><button onClick={() => void searchExternal()} disabled={loading} aria-label="Pesquisar fontes externas" className="w-10 rounded-xl bg-foreground text-background flex items-center justify-center disabled:opacity-50"><Search className="w-4 h-4" /></button></div>
      {results.length > 0 && <div className="mt-3 space-y-2 max-h-52 overflow-y-auto">{results.map((result) => <a key={result.url} href={result.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-border/50 p-2.5 hover:bg-secondary/40"><span className="flex items-center justify-between gap-2 text-caption font-semibold">{result.title}<ExternalLink className="w-3.5 h-3.5 shrink-0" /></span>{result.snippet && <span className="block text-[10px] text-muted-foreground mt-1 line-clamp-2">{result.snippet}</span>}</a>)}</div>}
      {message && <p className="mt-2 text-caption text-muted-foreground" role="status">{message}</p>}
    </GlassCard>
  );
}
