const { test, expect } = require('@playwright/test');
const { rodar, codigoDoAluno } = require('./helpers');

const EXPORTADOS = [
  'ContaBancaria', 'SaldoInsuficienteError', 'ContaPoupanca', 'Pilha', 'Fila', 'fibonacci', 'primeiros',
  'esperar', 'buscarComTimeout', 'executarEmSequencia', 'executarEmParalelo', 'tratarErros',
  'retry', 'limitarConcorrencia', 'EventEmitter',
];

test('R1 – O solucao.js carrega sem erro e exporta as 15 classes e funções pedidas', () => {
  const tipos = rodar((s, nomes) => nomes.map((n) => typeof s[n]), EXPORTADOS);
  const faltam = EXPORTADOS.filter((n, i) => tipos[i] !== 'function');
  expect(faltam, `Faltam exportar: ${faltam.join(', ')} (module.exports = { ... })`).toEqual([]);
});

test('R2 – Sem "var" e usando a sintaxe class (6+ classes)', () => {
  const codigo = codigoDoAluno();
  expect(codigo, 'Troque todo "var" por const ou let').not.toMatch(/\bvar\b/);
  const classes = (codigo.match(/\bclass\s+[A-Za-z_]\w*/g) || []).length;
  expect(classes, `Use a sintaxe "class Nome { ... }" (encontrei ${classes}; são esperadas 6: ContaBancaria, SaldoInsuficienteError, ContaPoupanca, Pilha, Fila e EventEmitter)`).toBeGreaterThanOrEqual(6);
});

test('R3 – ContaBancaria: titular, saldo, depositar, sacar e extrato (valores inválidos lançam erro)', () => {
  const r = rodar((s) => {
    const ContaBancaria = pegar('ContaBancaria');
    const c = new ContaBancaria('Ana', 100);
    const dep = c.depositar(50);
    const saq = c.sacar(30);
    const inval = [
      () => c.depositar(0), () => c.depositar(-5), () => c.depositar('10'),
      () => c.sacar(0), () => c.sacar(-1), () => c.sacar('5'),
      () => new ContaBancaria('X', -10),
    ].map((f) => { try { f(); return false; } catch (e) { return e instanceof Error; } });
    const extrato = c.extrato();
    extrato.push({ falso: true });
    return { titular: c.titular, dep, saq, saldo: c.saldo, zero: new ContaBancaria('Bia').saldo, inval, extrato: c.extrato() };
  });
  expect(r.titular, 'conta.titular deveria ser "Ana"').toBe('Ana');
  expect(r.dep, 'depositar(50) em uma conta com 100 deveria devolver o novo saldo: 150').toBe(150);
  expect(r.saq, 'sacar(30) com saldo 150 deveria devolver o novo saldo: 120').toBe(120);
  expect(r.saldo, 'Depois dos movimentos o saldo deveria ser 120 (operações inválidas não podem alterar o saldo)').toBe(120);
  expect(r.zero, 'new ContaBancaria("Bia") sem saldo inicial deveria começar com 0').toBe(0);
  expect(r.inval, 'Devem lançar erro (throw new Error): depositar(0), depositar(-5), depositar("10"), sacar(0), sacar(-1), sacar("5") e new ContaBancaria("X", -10)').toEqual([true, true, true, true, true, true, true]);
  expect(r.extrato, 'extrato() deveria listar { tipo, valor, saldoApos } de cada movimento (o saldo inicial não conta) e devolver uma CÓPIA').toEqual([
    { tipo: 'deposito', valor: 50, saldoApos: 150 }, { tipo: 'saque', valor: 30, saldoApos: 120 },
  ]);
});

test('R4 – SaldoInsuficienteError: erro customizado com saldoAtual e valorSolicitado', () => {
  const r = rodar((s) => {
    const ContaBancaria = pegar('ContaBancaria');
    const SaldoInsuficienteError = pegar('SaldoInsuficienteError');
    const c = new ContaBancaria('Ana', 100);
    let info = null;
    try { c.sacar(150); } catch (e) {
      info = { inst: e instanceof SaldoInsuficienteError, erro: e instanceof Error, nome: e.name, atual: e.saldoAtual, pedido: e.valorSolicitado, msg: e.message };
    }
    const direto = new SaldoInsuficienteError(10, 20);
    return { info, saldo: c.saldo, direto: { atual: direto.saldoAtual, pedido: direto.valorSolicitado, nome: direto.name } };
  });
  expect(r.info, 'sacar(150) com saldo 100 deveria lançar SaldoInsuficienteError (throw new SaldoInsuficienteError(...))').not.toBeNull();
  expect(r.info.inst && r.info.erro, 'SaldoInsuficienteError precisa ser uma classe que estende Error (class ... extends Error)').toBe(true);
  expect(r.info.nome, 'O erro deve ter name = "SaldoInsuficienteError" (this.name = ...)').toBe('SaldoInsuficienteError');
  expect([r.info.atual, r.info.pedido], 'O erro deve guardar saldoAtual (100) e valorSolicitado (150)').toEqual([100, 150]);
  expect(/100/.test(r.info.msg) && /150/.test(r.info.msg), `A mensagem deve citar o saldo e o valor pedido (ex.: "Saldo insuficiente: saldo 100, solicitado 150"). Veio: "${r.info.msg}"`).toBe(true);
  expect(r.saldo, 'Um saque recusado não pode alterar o saldo (deveria continuar 100)').toBe(100);
  expect(r.direto, 'new SaldoInsuficienteError(10, 20) deveria guardar saldoAtual 10 e valorSolicitado 20 (parâmetros nessa ordem)').toEqual({ atual: 10, pedido: 20, nome: 'SaldoInsuficienteError' });
});

test('R5 – ContaPoupanca extends ContaBancaria: renderJuros(taxa) e limite de 2 saques (usa super)', () => {
  expect(codigoDoAluno(), 'ContaPoupanca precisa usar super (super.sacar(...) / super(...))').toMatch(/\bsuper\b/);
  const r = rodar((s) => {
    const ContaPoupanca = pegar('ContaPoupanca');
    const ContaBancaria = pegar('ContaBancaria');
    const p = new ContaPoupanca('Cris', 1000);
    const juros = p.renderJuros(0.01);
    const s1 = p.sacar(10);
    const s2 = p.sacar(10);
    let terceiro = null;
    try { p.sacar(10); } catch (e) { terceiro = e.message; }
    const saldoApos3 = p.saldo;
    const dep = p.depositar(500);
    return { instancia: p instanceof ContaBancaria, juros, s1, s2, terceiro, saldoApos3, dep, extrato: p.extrato(), outro: new ContaPoupanca('Dan', 250).renderJuros(0.02) };
  });
  expect(r.instancia, 'ContaPoupanca precisa estender ContaBancaria (class ContaPoupanca extends ContaBancaria)').toBe(true);
  expect(r.juros, 'renderJuros(0.01) com saldo 1000 deveria somar 10 e devolver o novo saldo: 1010').toBe(1010);
  expect([r.s1, r.s2], 'Os dois primeiros saques funcionam e devolvem o novo saldo (1000 e 990)').toEqual([1000, 990]);
  expect(r.terceiro, 'O 3º saque da poupança deveria lançar um erro (ex.: throw new Error("Limite de saques atingido")), mas não lançou').not.toBeNull();
  expect(/limite/i.test(r.terceiro), `A mensagem do erro do 3º saque deveria conter "limite" (ex.: "Limite de saques atingido"). Veio: "${r.terceiro}"`).toBe(true);
  expect(r.saldoApos3, 'O saque recusado por limite não pode mexer no saldo (990)').toBe(990);
  expect(r.dep, 'depositar continua funcionando na poupança (herdado): 990 + 500 = 1490').toBe(1490);
  expect(r.extrato, 'O extrato da poupança deveria registrar o juros com tipo "juros" e depois os saques e o depósito').toEqual([
    { tipo: 'juros', valor: 10, saldoApos: 1010 }, { tipo: 'saque', valor: 10, saldoApos: 1000 },
    { tipo: 'saque', valor: 10, saldoApos: 990 }, { tipo: 'deposito', valor: 500, saldoApos: 1490 },
  ]);
  expect(r.outro, 'renderJuros(0.02) com saldo 250 deveria dar 255').toBe(255);
});

test('R6 – Encapsulamento: o saldo é um campo PRIVADO (#) e só pode ser lido pelo getter', () => {
  expect(codigoDoAluno(), 'Use campos privados com # (ex.: #saldo) na ContaBancaria').toMatch(/#[A-Za-z_]\w*/);
  const r = rodar((s) => {
    const ContaBancaria = pegar('ContaBancaria');
    const c = new ContaBancaria('Ana', 100);
    try { c.saldo = 999; } catch (e) { /* em modo estrito lança erro; tudo bem */ }
    const desc = Object.getOwnPropertyDescriptor(ContaBancaria.prototype, 'saldo');
    return { saldo: c.saldo, chaves: Object.keys(c), json: JSON.stringify(c), getter: typeof (desc && desc.get), setter: typeof (desc && desc.set) };
  });
  expect(r.saldo, 'conta.saldo = 999 não pode alterar o saldo (continua 100)').toBe(100);
  expect(r.chaves.some((k) => /saldo/i.test(k)) || /saldo/i.test(r.json), `O saldo não pode aparecer como propriedade pública (chaves: ${r.chaves.join(', ')})`).toBe(false);
  expect(r.getter, 'saldo precisa ser um getter na classe: get saldo() { ... }').toBe('function');
  expect(r.setter, 'saldo NÃO deve ter setter (só leitura)').toBe('undefined');
});

test('R7 – Pilha: empilhar (encadeável), desempilhar, topo, vazia e tamanho (getter)', () => {
  const r = rodar((s) => {
    const Pilha = pegar('Pilha');
    const p = new Pilha();
    const ini = { vazia: p.vazia(), tam: p.tamanho, topo: p.topo(), pop: p.desempilhar() };
    const enc = p.empilhar(1).empilhar(2).empilhar(3);
    return { ini, encadeia: enc === p, tam: p.tamanho, topo: p.topo(), pops: [p.desempilhar(), p.desempilhar(), p.desempilhar(), p.desempilhar()], fim: p.vazia(), tipoTam: typeof p.tamanho };
  });
  expect(r.ini, 'Pilha nova: vazia() true, tamanho 0, topo() e desempilhar() devolvem undefined').toEqual({ vazia: true, tam: 0, topo: undefined, pop: undefined });
  expect(r.encadeia, 'empilhar deve devolver this (para encadear: p.empilhar(1).empilhar(2))').toBe(true);
  expect(r.tipoTam, '"tamanho" deve ser um getter (get tamanho()), usado sem parênteses: pilha.tamanho').toBe('number');
  expect([r.tam, r.topo], 'Depois de empilhar 1, 2, 3: tamanho 3 e topo() 3').toEqual([3, 3]);
  expect(r.pops, 'A pilha é LIFO: desempilhar() deveria dar 3, 2, 1 e depois undefined').toEqual([3, 2, 1, undefined]);
  expect(r.fim, 'Depois de desempilhar tudo, vazia() deveria ser true').toBe(true);
});

test('R8 – Fila: enfileirar, desenfileirar, frente, vazia, tamanho e iterável com for...of / spread', () => {
  const r = rodar((s) => {
    const Fila = pegar('Fila');
    const f = new Fila();
    const ini = { vazia: f.vazia(), tam: f.tamanho, frente: f.frente(), des: f.desenfileirar() };
    const enc = f.enfileirar('a').enfileirar('b').enfileirar('c');
    const spread = [...f];
    const tamDepois = f.tamanho;
    const viaForOf = [];
    for (const x of f) viaForOf.push(x);
    const frente = f.frente();
    const des = [f.desenfileirar(), f.desenfileirar(), f.desenfileirar(), f.desenfileirar()];
    return { ini, encadeia: enc === f, spread, tamDepois, viaForOf, frente, des, fim: f.vazia() };
  }, null, { ms: 3000 });
  expect(r.ini, 'Fila nova: vazia() true, tamanho 0, frente() e desenfileirar() devolvem undefined').toEqual({ vazia: true, tam: 0, frente: undefined, des: undefined });
  expect(r.encadeia, 'enfileirar deve devolver this (encadeável)').toBe(true);
  expect(r.spread, 'A fila deve ser iterável do primeiro ao último: [...fila] → ["a","b","c"] (dica: *[Symbol.iterator]() { ... })').toEqual(['a', 'b', 'c']);
  expect(r.tamDepois, 'Iterar NÃO pode consumir a fila (tamanho continua 3)').toBe(3);
  expect(r.viaForOf, 'for (const x of fila) deveria visitar a, b, c').toEqual(['a', 'b', 'c']);
  expect(r.frente, 'frente() deveria mostrar "a" sem remover').toBe('a');
  expect(r.des, 'A fila é FIFO: desenfileirar() deveria dar a, b, c e depois undefined').toEqual(['a', 'b', 'c', undefined]);
  expect(r.fim, 'Depois de esvaziar, vazia() deveria ser true').toBe(true);
});

test('R9 – Geradores: fibonacci() infinito (function*) e primeiros(iteravel, n)', () => {
  const r = rodar((s) => {
    const fib = pegar('fibonacci');
    const primeiros = pegar('primeiros');
    const a = fib();
    const b = fib();
    a.next(); a.next(); a.next();
    return {
      ehGerador: Object.getPrototypeOf(fib).constructor.name === 'GeneratorFunction',
      dez: primeiros(fib(), 10),
      array: primeiros([1, 2, 3], 2),
      curto: primeiros([1], 5),
      zero: primeiros(fib(), 0),
      texto: primeiros('abc', 2),
      conjunto: primeiros(new Set([5, 6, 7]), 2),
      independente: b.next().value,
    };
  }, null, { ms: 3000, dica: 'Dica: primeiros precisa PARAR depois de n itens (break/return); com fibonacci() infinito, juntar tudo num array nunca termina.' });
  expect(r.ehGerador, 'fibonacci precisa ser uma função geradora: function* fibonacci() { ... yield ... }').toBe(true);
  expect(r.dez, 'primeiros(fibonacci(), 10) deveria dar [0,1,1,2,3,5,8,13,21,34]').toEqual([0, 1, 1, 2, 3, 5, 8, 13, 21, 34]);
  expect(r.array, 'primeiros([1,2,3], 2) deveria dar [1,2]').toEqual([1, 2]);
  expect(r.curto, 'primeiros([1], 5) deveria dar [1] (acabou antes de n)').toEqual([1]);
  expect(r.zero, 'primeiros(fibonacci(), 0) deveria dar []').toEqual([]);
  expect(r.texto, 'primeiros("abc", 2) funciona com qualquer iterável: ["a","b"]').toEqual(['a', 'b']);
  expect(r.conjunto, 'primeiros(new Set([5,6,7]), 2) deveria dar [5,6]').toEqual([5, 6]);
  expect(r.independente, 'Cada fibonacci() é independente: um gerador novo começa de novo em 0').toBe(0);
});

test('R10 – esperar(ms): Promise que resolve depois do tempo pedido', async () => {
  const r = rodar(async (s) => {
    const esperar = pegar('esperar');
    const t0 = Date.now();
    const p = esperar(100);
    const ehPromise = p instanceof Promise;
    const v = await p;
    return { ehPromise, v, ms: Date.now() - t0 };
  });
  expect(r.ehPromise, 'esperar(ms) precisa devolver uma Promise').toBe(true);
  expect(r.v, 'A Promise de esperar resolve sem valor (undefined)').toBeUndefined();
  expect(r.ms, `esperar(100) demorou ${r.ms}ms; deveria esperar cerca de 100ms`).toBeGreaterThanOrEqual(95);
  expect(r.ms, `esperar(100) demorou ${r.ms}ms; é demais`).toBeLessThan(400);
});

test('R11 – buscarComTimeout(promessa, ms): rejeita com "Timeout" se demorar demais (Promise.race)', () => {
  const r = rodar(async (s) => {
    const buscar = pegar('buscarComTimeout');
    const apos = (ms, v) => new Promise((res) => setTimeout(() => res(v), ms));
    const rapida = await buscar(apos(20, 'ok'), 300);
    let timeout = null;
    try { await buscar(apos(500, 'tarde'), 50); } catch (e) { timeout = { erro: e instanceof Error, msg: e.message }; }
    let propagado = null;
    try { await buscar(new Promise((_, rej) => setTimeout(() => rej(new Error('falhou')), 10)), 300); } catch (e) { propagado = e.message; }
    return { rapida, timeout, propagado };
  });
  expect(r.rapida, 'Se a promessa resolve a tempo, devolva o valor dela: "ok"').toBe('ok');
  expect(r.timeout, 'Se a promessa demora mais que o limite, buscarComTimeout deve REJEITAR').not.toBeNull();
  expect(r.timeout.erro && /timeout/i.test(r.timeout.msg), `A rejeição deve ser um Error com a mensagem "Timeout". Veio: ${JSON.stringify(r.timeout)}`).toBe(true);
  expect(r.propagado, 'Se a própria promessa falha, o erro dela deve ser repassado ("falhou")').toBe('falhou');
});

test('R12 – executarEmSequencia(tarefas): uma de cada vez, em ordem, devolvendo os resultados em ordem', () => {
  const r = rodar(async (s) => {
    const exec = pegar('executarEmSequencia');
    const log = [];
    const tarefa = (id, ms) => () => { log.push('i' + id); return new Promise((res) => setTimeout(() => { log.push('f' + id); res(id * 10); }, ms)); };
    const resultados = await exec([tarefa(1, 50), tarefa(2, 10), tarefa(3, 30)]);
    const vazio = await exec([]);
    const log2 = [];
    let erro = null;
    try { await exec([() => Promise.resolve(1), () => Promise.reject(new Error('boom')), () => { log2.push('terceira'); return Promise.resolve(3); }]); } catch (e) { erro = e.message; }
    return { log, resultados, vazio, erro, log2 };
  });
  expect(r.log, 'Em sequência, cada tarefa só COMEÇA depois que a anterior TERMINA: i1,f1,i2,f2,i3,f3').toEqual(['i1', 'f1', 'i2', 'f2', 'i3', 'f3']);
  expect(r.resultados, 'Os resultados devem vir na ordem das tarefas: [10, 20, 30]').toEqual([10, 20, 30]);
  expect(r.vazio, 'Sem tarefas, o resultado é []').toEqual([]);
  expect(r.erro, 'Se uma tarefa falha, a execução rejeita com esse erro ("boom")').toBe('boom');
  expect(r.log2, 'Depois de uma falha, as tarefas seguintes NÃO devem rodar').toEqual([]);
});

test('R13 – executarEmParalelo(tarefas): todas ao mesmo tempo (Promise.all), resultados na ordem original', () => {
  const r = rodar(async (s) => {
    const exec = pegar('executarEmParalelo');
    const log = [];
    const tarefa = (id, ms) => () => { log.push('i' + id); return new Promise((res) => setTimeout(() => { log.push('f' + id); res(id * 10); }, ms)); };
    const t0 = Date.now();
    const resultados = await exec([tarefa(1, 50), tarefa(2, 10), tarefa(3, 30)]);
    const ms = Date.now() - t0;
    const vazio = await exec([]);
    let erro = null;
    try { await exec([() => Promise.resolve(1), () => Promise.reject(new Error('boom'))]); } catch (e) { erro = e.message; }
    return { log, resultados, ms, vazio, erro };
  });
  expect(r.log, 'Em paralelo, todas COMEÇAM juntas e terminam por tempo: i1,i2,i3,f2,f3,f1').toEqual(['i1', 'i2', 'i3', 'f2', 'f3', 'f1']);
  expect(r.resultados, 'Mesmo terminando fora de ordem, os resultados vêm na ordem das tarefas: [10, 20, 30]').toEqual([10, 20, 30]);
  expect(r.ms, `Em paralelo o tempo total é o da tarefa mais lenta (~50ms), não a soma. Demorou ${r.ms}ms`).toBeLessThan(110);
  expect(r.vazio, 'Sem tarefas, o resultado é []').toEqual([]);
  expect(r.erro, 'Se uma tarefa falha, rejeita com o erro dela ("boom")').toBe('boom');
});

test('R14 – tratarErros(promessas): { sucessos, falhas } sem deixar nenhuma falha derrubar as outras (allSettled)', () => {
  const r = rodar(async (s) => {
    const tratar = pegar('tratarErros');
    const t = async (f) => { try { return { v: await f() }; } catch (e) { return { rejeitou: String(e && e.message) }; } };
    return {
      misto: await t(() => tratar([Promise.resolve(1), Promise.reject(new Error('x')), Promise.resolve(3), Promise.reject(new Error('y'))])),
      vazio: await t(() => tratar([])),
      soFalhas: await t(() => tratar([Promise.reject(new Error('a'))])),
    };
  });
  const confere = (chave, esperado, msg) => {
    expect(r[chave].rejeitou, `tratarErros não pode REJEITAR (recebeu o erro "${r[chave].rejeitou}"): ela deve juntar as falhas no resultado. Dica: Promise.allSettled`).toBeUndefined();
    expect(r[chave].v, msg).toEqual(esperado);
  };
  confere('misto', { sucessos: [1, 3], falhas: ['x', 'y'] }, 'tratarErros([ok 1, erro "x", ok 3, erro "y"]) deveria dar { sucessos: [1, 3], falhas: ["x", "y"] } (falhas = mensagens dos erros, na ordem)');
  confere('vazio', { sucessos: [], falhas: [] }, 'tratarErros([]) deveria dar { sucessos: [], falhas: [] }');
  confere('soFalhas', { sucessos: [], falhas: ['a'] }, 'Só falhas: { sucessos: [], falhas: ["a"] }');
});

test('R15 – 🔥 retry(fn, tentativas, atrasoMs): tenta de novo com espera que DOBRA a cada falha (backoff exponencial)', () => {
  const r = rodar(async (s) => {
    const retry = pegar('retry');
    const marcas = [];
    let n = 0;
    const v = await retry(async () => { marcas.push(Date.now()); n++; if (n < 4) throw new Error('falha ' + n); return 'ok'; }, 4, 30);
    const gaps = [marcas[1] - marcas[0], marcas[2] - marcas[1], marcas[3] - marcas[2]];
    let m = 0;
    let ultimo = null;
    try { await retry(async () => { m++; throw new Error('erro ' + m); }, 3, 5); } catch (e) { ultimo = e.message; }
    let k = 0;
    const t0 = Date.now();
    const direto = await retry(async () => { k++; return 'rapido'; }, 3, 200);
    const msDireto = Date.now() - t0;
    let u = 0;
    let umaErro = null;
    const t1 = Date.now();
    try { await retry(async () => { u++; throw new Error('so uma'); }, 1, 200); } catch (e) { umaErro = e.message; }
    const msUma = Date.now() - t1;
    return { v, n, gaps, m, ultimo, k, direto, msDireto, u, umaErro, msUma };
  });
  expect([r.v, r.n], 'Falhando 3 vezes e acertando na 4ª, retry deveria devolver "ok" depois de 4 chamadas').toEqual(['ok', 4]);
  expect(r.gaps[0], `Antes da 2ª tentativa espere ~30ms (esperou ${r.gaps[0]}ms)`).toBeGreaterThanOrEqual(25);
  expect(r.gaps[1], `Antes da 3ª tentativa espere o DOBRO, ~60ms (esperou ${r.gaps[1]}ms)`).toBeGreaterThanOrEqual(55);
  expect(r.gaps[2], `Antes da 4ª tentativa espere de novo o dobro, ~120ms (esperou ${r.gaps[2]}ms). Atraso: 30, 60, 120...`).toBeGreaterThanOrEqual(110);
  expect([r.ultimo, r.m], 'Se todas as tentativas falham, rejeite com o ÚLTIMO erro ("erro 3") depois de exatamente 3 chamadas').toEqual(['erro 3', 3]);
  expect([r.direto, r.k], 'Se der certo de primeira, devolva o valor sem repetir nem esperar').toEqual(['rapido', 1]);
  expect(r.msDireto, 'Se der certo de primeira não deve haver espera').toBeLessThan(100);
  expect([r.umaErro, r.u], 'Com 1 tentativa só: uma chamada e rejeita com o erro dela').toEqual(['so uma', 1]);
  expect(r.msUma, 'Depois da ÚLTIMA tentativa não se espera mais nada').toBeLessThan(100);
});

test('R16 – 🔥 limitarConcorrencia(tarefas, limite): no máximo N ao mesmo tempo, e já puxa a próxima assim que uma termina', () => {
  const r = rodar(async (s) => {
    const limitar = pegar('limitarConcorrencia');
    let rodando = 0;
    let maximo = 0;
    const tarefa = (i) => async () => { rodando++; maximo = Math.max(maximo, rodando); await new Promise((res) => setTimeout(res, 30)); rodando--; return i; };
    const t0 = Date.now();
    const res = await limitar([0, 1, 2, 3, 4, 5].map(tarefa), 2);
    const ms = Date.now() - t0;
    const maximo2 = maximo;

    rodando = 0; maximo = 0;
    const res1 = await limitar([0, 1, 2].map(tarefa), 1);
    const maximo1 = maximo;

    rodando = 0; maximo = 0;
    await limitar([0, 1, 2, 3, 4, 5, 6, 7].map(tarefa), 3);
    const maximo3 = maximo;

    const log = [];
    const dur = (id, tempo) => async () => { log.push('i' + id); await new Promise((r2) => setTimeout(r2, tempo)); log.push('f' + id); return id; };
    const res2 = await limitar([dur(0, 200), dur(1, 40), dur(2, 40), dur(3, 40)], 2);

    const res3 = await limitar([async () => 'a', async () => 'b'], 10);
    const res4 = await limitar([], 3);
    let erro = null;
    try { await limitar([async () => 1, async () => { throw new Error('boom'); }, async () => 3], 2); } catch (e) { erro = e.message; }
    return { res, maximo2, ms, res1, maximo1, maximo3, log, res2, res3, res4, erro };
  });
  expect(r.res, 'Os resultados vêm na ordem das tarefas: [0,1,2,3,4,5]').toEqual([0, 1, 2, 3, 4, 5]);
  expect(r.res1, 'Com limite 1 os resultados também vêm em ordem: [0,1,2]').toEqual([0, 1, 2]);
  expect(r.maximo1, 'Com limite 1, só 1 tarefa pode rodar por vez').toBe(1);
  expect(r.maximo2, `Com limite 2, o máximo de tarefas simultâneas deveria ser exatamente 2 (foi ${r.maximo2})`).toBe(2);
  expect(r.maximo3, `Com limite 3, o máximo de tarefas simultâneas deveria ser exatamente 3 (foi ${r.maximo3})`).toBe(3);
  expect(r.ms, `6 tarefas de 30ms com limite 2 deveriam levar ~90ms (3 rodadas de 2). Levou ${r.ms}ms`).toBeGreaterThanOrEqual(80);
  expect(r.ms, `6 tarefas de 30ms com limite 2 deveriam levar ~90ms. Levou ${r.ms}ms: está rodando uma por vez?`).toBeLessThan(160);
  expect(r.log, 'Assim que uma tarefa termina, a próxima deve COMEÇAR (não espere o grupo todo acabar). Esperado: i0,i1,f1,i2,f2,i3,f3,f0').toEqual(['i0', 'i1', 'f1', 'i2', 'f2', 'i3', 'f3', 'f0']);
  expect(r.res2, 'Resultados em ordem mesmo terminando fora de ordem: [0,1,2,3]').toEqual([0, 1, 2, 3]);
  expect(r.res3, 'Limite maior que o número de tarefas funciona: ["a","b"]').toEqual(['a', 'b']);
  expect(r.res4, 'Sem tarefas o resultado é []').toEqual([]);
  expect(r.erro, 'Se uma tarefa falha, rejeita com o erro dela ("boom")').toBe('boom');
});

test('R17 – 🔥 EventEmitter: on, once, off, emit (retorna se havia ouvintes) e listenerCount', () => {
  const r = rodar((s) => {
    const EventEmitter = pegar('EventEmitter');
    const e = new EventEmitter();
    const log = [];
    const a = (...args) => log.push(['a', ...args]);
    const b = (...args) => log.push(['b', ...args]);
    const r1 = e.on('x', a);
    const r2 = e.on('x', b);
    const comOuvintes = e.emit('x', 1, 2);
    const semOuvinte = e.emit('y');
    e.off('x', a);
    e.emit('x', 3);
    const vezes = [];
    e.once('z', (v) => vezes.push(v));
    e.emit('z', 'um');
    e.emit('z', 'dois');
    const log2 = [];
    const e2 = new EventEmitter();
    const auto = () => { log2.push('auto'); e2.off('w', auto); };
    e2.on('w', auto);
    e2.on('w', () => log2.push('segundo'));
    e2.emit('w');
    e2.emit('w');
    return { encadeia: r1 === e && r2 === e, comOuvintes, semOuvinte, log, vezes, log2, contagem: [e.listenerCount('x'), e.listenerCount('nada')] };
  });
  expect(r.encadeia, 'on() deve devolver this (encadeável)').toBe(true);
  expect([r.comOuvintes, r.semOuvinte], 'emit devolve true se havia ouvintes e false se não havia').toEqual([true, false]);
  expect(r.log, 'Os ouvintes rodam na ordem em que foram registrados, recebendo os argumentos do emit; depois do off(a) só o b continua').toEqual([['a', 1, 2], ['b', 1, 2], ['b', 3]]);
  expect(r.vezes, 'once() chama o ouvinte uma única vez: ["um"]').toEqual(['um']);
  expect(r.log2, 'Um ouvinte que se remove durante o emit não pode fazer o próximo ser pulado (itere sobre uma CÓPIA). Esperado: auto, segundo, segundo').toEqual(['auto', 'segundo', 'segundo']);
  expect(r.contagem, 'listenerCount("x") deveria ser 1 (só o b sobrou) e listenerCount("nada") 0').toEqual([1, 0]);
});
