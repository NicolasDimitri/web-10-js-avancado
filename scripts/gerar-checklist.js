// Lê resultado.json (gerado pelo Playwright) e monta comentario.md com a tabela de requisitos.
// Cada commit gera UM COMENTÁRIO NOVO no PR (o marcador inclui o SHA do commit).
const fs = require('fs');

const shaCompleto = process.env.HEAD_SHA || '';
const sha = shaCompleto.slice(0, 7) || 'desconhecido';
const run = process.env.RUN_URL || '';
const commitUrl = process.env.COMMIT_URL || '';
const MARCA = `<!-- autoavaliacao:${shaCompleto || 'local'} -->`;

const escapar = (s = '') =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\|/g, '\\|');
const limpar = (s = '') => s.replace(/\x1b\[[0-9;]*m/g, '');
const primeiraLinha = (s = '') =>
  limpar(s).split('\n').map((l) => l.trim()).find(Boolean)?.replace(/^Error:\s*/, '') || '';

function coletar(suite, saida) {
  for (const spec of suite.specs || []) {
    const t = spec.tests?.[0];
    const r = t?.results?.[0];
    const pulado = t?.status === 'skipped' || r?.status === 'interrupted';
    saida.push({
      titulo: spec.title,
      ok: spec.ok === true && !pulado,
      pulado,
      erro: primeiraLinha(r?.error?.message || r?.errors?.[0]?.message || ''),
    });
  }
  for (const s of suite.suites || []) coletar(s, saida);
}

let corpo;
try {
  const dados = JSON.parse(fs.readFileSync('resultado.json', 'utf8'));
  const itens = [];
  for (const s of dados.suites || []) coletar(s, itens);
  if (!itens.length) throw new Error('sem testes no resultado');

  const feitos = itens.filter((i) => i.ok).length;
  const pct = Math.round((feitos / itens.length) * 100);
  const cheios = Math.floor(pct / 10);                       // barra de 10 blocos
  const barra = '🟩'.repeat(cheios) + '⬜'.repeat(10 - cheios);

  const linhas = itens.map((i) => {
    const icone = i.ok ? '✅' : i.pulado ? '⏭️' : '❌';
    const falta = i.ok ? '—' : i.pulado ? 'Não chegou a rodar (algum teste travou: procure um laço infinito)' : escapar(i.erro) || 'Veja o log da execução';
    return `| ${icone} | ${escapar(i.titulo)} | ${falta} |`;
  });

  corpo = `### ${feitos}/${itens.length} requisitos concluídos — **${pct}%**\n\n${barra}\n\n`;
  corpo += '| Resultado | Requisito | O que falta |\n|:-:|---|---|\n' + linhas.join('\n') + '\n\n';
  corpo += feitos === itens.length
    ? '🎉 **Todos os requisitos foram concluídos!** Sua entrega está completa. O PR fica aberto para o instrutor revisar (nesta atividade não há merge na `main`).'
    : 'Corrija o que está com ❌ e envie um novo commit: uma nova tabela será adicionada abaixo, e esta fica como histórico.';
} catch (e) {
  corpo = '⚠️ Os testes não puderam ser executados neste commit. ' +
    (run ? `Veja o [log da execução](${run}) para entender o motivo.` : 'Veja o log da execução.');
}

const ref = commitUrl ? `[\`${sha}\`](${commitUrl})` : `\`${sha}\``;
const rodape = run ? `\n\n<sub>[Ver log completo da execução](${run})</sub>` : '';
const md = `${MARCA}\n## 🧪 Autoavaliação — commit ${ref}\n\n${corpo}${rodape}\n`;

fs.writeFileSync('comentario.md', md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
console.log(md);
