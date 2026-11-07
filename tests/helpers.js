const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { expect } = require('@playwright/test');

const ARQ = path.resolve(__dirname, '..', 'solucao.js');

// ---------- como mostrar valores nas mensagens ----------
function fmt(v) {
  if (v === undefined) return 'undefined';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'bigint') return `${v}n`;
  if (typeof v === 'function') return '[função]';
  try { return JSON.stringify(v); } catch { return String(v); }
}

// ---------- código-fonte sem comentários e sem o conteúdo dos textos ----------
function codigoLimpo(texto) {
  const re = /("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|\/\/[^\n]*|\/\*[\s\S]*?\*\//g;
  return texto.replace(re, (m, str) => (str ? '""' : ' '));
}

function codigoDoAluno() {
  if (!fs.existsSync(ARQ)) throw new Error('Arquivo solucao.js não encontrado na raiz do repositório');
  return codigoLimpo(fs.readFileSync(ARQ, 'utf8'));
}

// ---------- executa um trecho de teste com o solucao.js em um PROCESSO SEPARADO ----------
// Se o código do aluno entrar em loop infinito ou demorar demais, só ESTE requisito falha.
// fn(s, dados): s = módulo do aluno; "pegar('nome')" devolve uma função exportada.
// O que fn devolve precisa poder virar JSON (undefined, NaN, Infinity e BigInt são preservados).
function rodar(fn, dados = null, { ms = 5000, dica = '' } = {}) {
  if (!fs.existsSync(ARQ)) throw new Error('Arquivo solucao.js não encontrado na raiz do repositório');
  const codigo = `
const _rep = (k, v) => v === undefined ? { __t: 'undef' } : typeof v === 'bigint' ? { __t: 'big', v: String(v) } : (typeof v === 'number' && !Number.isFinite(v)) ? { __t: 'num', v: String(v) } : v;
const _fim = (tag, v) => process.stdout.write('\\n@@' + tag + '@@' + JSON.stringify(v, _rep) + '\\n', () => process.exit(0));
let s;
try { s = require(${JSON.stringify(ARQ)}); } catch (e) { _fim('ERRO', 'Não consegui carregar o solucao.js: ' + (e && e.message)); }
const pegar = (n) => { if (typeof s[n] !== 'function') throw new Error('Falta exportar "' + n + '" (module.exports = { ' + n + ', ... })'); return s[n]; };
if (s) (async () => {
  try { const r = await (${fn.toString()})(s, ${JSON.stringify(dados)}); _fim('OK', r === undefined ? null : r); }
  catch (e) { const m = String((e && e.message) || e); _fim('ERRO', /^Falta exportar/.test(m) ? m : 'Seu código lançou um erro: ' + m); }
})();
`;
  const r = spawnSync(process.execPath, ['-e', codigo], { encoding: 'utf8', timeout: ms, maxBuffer: 20 * 1024 * 1024 });
  const out = r.stdout || '';
  const iOk = out.lastIndexOf('\n@@OK@@');
  const iErro = out.lastIndexOf('\n@@ERRO@@');
  const rev = (k, v) => (v && typeof v === 'object' && v.__t ? (v.__t === 'undef' ? undefined : v.__t === 'big' ? BigInt(v.v) : Number(v.v)) : v);
  if (iErro > iOk) throw new Error(JSON.parse(out.slice(iErro + 9).split('\n')[0]));
  if (iOk >= 0) return JSON.parse(out.slice(iOk + 7).split('\n')[0], rev);
  if (r.error && r.error.code === 'ETIMEDOUT') {
    throw new Error(`Seu código demorou mais de ${ms / 1000}s para responder. Procure um laço infinito (while/for que nunca termina) ou uma solução lenta demais.${dica ? ' ' + dica : ''}`);
  }
  throw new Error('Seu código travou ou estourou a memória. Procure um laço ou uma recursão infinita.');
}

// ---------- funções puras: confere uma tabela de [argumentos, resultado esperado] ----------
function casos(nome, tabela, opcoes = {}) {
  const saidas = rodar((s, d) => {
    const f = pegar(d.nome);
    return d.chamadas.map((args) => { try { return { v: f(...args) }; } catch (e) { return { erro: String((e && e.message) || e) }; } });
  }, { nome, chamadas: tabela.map((c) => c[0]) }, opcoes);
  tabela.forEach(([args, esperado], i) => {
    const o = saidas[i];
    const chamada = `${nome}(${args.map(fmt).join(', ')})`;
    if (o.erro !== undefined) throw new Error(`${chamada} lançou um erro: ${o.erro}`);
    expect(o.v, `${chamada} deveria retornar ${fmt(esperado)}, mas retornou ${fmt(o.v)}`).toEqual(esperado);
  });
}

// ---------- funções que DEVEM lançar erro para estes argumentos ----------
function casosErro(nome, listaDeArgs, opcoes = {}) {
  const saidas = rodar((s, d) => {
    const f = pegar(d.nome);
    return d.chamadas.map((args) => { try { f(...args); return false; } catch (e) { return e instanceof Error; } });
  }, { nome, chamadas: listaDeArgs }, opcoes);
  listaDeArgs.forEach((args, i) => {
    expect(saidas[i], `${nome}(${args.map(fmt).join(', ')}) deveria lançar um erro (throw new Error(...)), mas não lançou`).toBe(true);
  });
}

// ---------- código-fonte de funções/classes exportadas ----------
function fontesDe(nomes, { limpo = true } = {}) {
  const fontes = rodar((s, ns) => ns.map((n) => (typeof s[n] === 'function' ? String(s[n]) : '')), nomes);
  return fontes.map((f) => (limpo ? codigoLimpo(f) : f));
}

function exigirSemLacos(nomes, dica = 'use map, filter ou reduce') {
  fontesDe(nomes).forEach((src, i) => {
    expect(/\b(for|while)\b/.test(src), `${nomes[i]}: não use for/while nesta função (${dica})`).toBe(false);
  });
}

module.exports = { fs, rodar, casos, casosErro, fontesDe, exigirSemLacos, codigoDoAluno, codigoLimpo, fmt };
