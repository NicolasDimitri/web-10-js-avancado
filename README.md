# Projeto 10 – Classes e Assincronismo (JavaScript) · Nível ⭐⭐⭐ → 🔥

O desafio final de JavaScript: **classes** (herança, campos privados, erros customizados), **geradores** e **código assíncrono** (Promises, `async/await`, tempo). Os últimos três requisitos (🔥) são problemas clássicos de entrevista e de projetos reais.

## Como funciona

- Você escreve tudo em **`solucao.js`** (as classes e funções já estão lá, vazias).
- O robô cria objetos e chama as suas funções, inclusive medindo **tempo** (nos requisitos assíncronos). Quando algo falha, a tabela mostra o que era esperado.
- Use `module.exports = { ... }` (já está no arquivo).

## Requisitos

1. **R1** – O `solucao.js` carrega sem erro e exporta as 15 classes/funções.
2. **R2** – Sem `var`, e usando a sintaxe `class` (as 6 classes: `ContaBancaria`, `SaldoInsuficienteError`, `ContaPoupanca`, `Pilha`, `Fila` e `EventEmitter`).
3. **R3** – `ContaBancaria(titular, saldoInicial = 0)`: tem `titular`, o getter `saldo`, `depositar(valor)` e `sacar(valor)` (os dois devolvem o novo saldo) e `extrato()`, que devolve uma **cópia** da lista de `{ tipo: 'deposito' | 'saque', valor, saldoApos }` (o saldo inicial não conta como movimento). Valor que não é número, ou é ≤ 0, e saldo inicial negativo **lançam erro** sem alterar nada.
4. **R4** – `SaldoInsuficienteError extends Error`, com `name = 'SaldoInsuficienteError'`, `saldoAtual` e `valorSolicitado` (nessa ordem no construtor) e uma mensagem que cita os dois valores (ex.: `Saldo insuficiente: saldo 100, solicitado 150`). `sacar` mais do que o saldo lança esse erro e **não** altera o saldo.
5. **R5** – `ContaPoupanca extends ContaBancaria` (use `super`): `renderJuros(taxa)` soma `saldo × taxa` (arredondado em centavos), registra no extrato com `tipo: 'juros'` e devolve o novo saldo. Só permite **2 saques**; o 3º lança um erro cuja mensagem contém "limite" (ex.: `Limite de saques atingido`) e não altera o saldo.
6. **R6** – Encapsulamento: o saldo é um **campo privado** (`#saldo`), lido só pelo getter `saldo` (sem setter). `conta.saldo = 999` não pode funcionar e o saldo não pode aparecer em `Object.keys(conta)` nem em `JSON.stringify(conta)`.
7. **R7** – `Pilha` (último a entrar, primeiro a sair): `empilhar(x)` (devolve `this`, para encadear), `desempilhar()`, `topo()`, `vazia()` e o getter `tamanho`. Em pilha vazia, `desempilhar()` e `topo()` devolvem `undefined`.
8. **R8** – `Fila` (primeiro a entrar, primeiro a sair): `enfileirar(x)` (devolve `this`), `desenfileirar()`, `frente()`, `vazia()` e o getter `tamanho`. Também deve ser **iterável** (`[...fila]` e `for...of`, do primeiro ao último, **sem consumir** a fila).
9. **R9** – `fibonacci()` é uma **função geradora** (`function*`) que gera `0, 1, 1, 2, 3, 5, 8...` para sempre (cada chamada cria um gerador independente). `primeiros(iteravel, n)` devolve um array com os `n` primeiros itens de **qualquer iterável** (inclusive o infinito!) e **para** em `n`.
10. **R10** – `esperar(ms)`: devolve uma Promise que resolve (sem valor) depois de `ms` milissegundos.
11. **R11** – `buscarComTimeout(promessa, ms)`: resolve com o valor da promessa se ela terminar a tempo; se demorar mais de `ms`, **rejeita** com `new Error('Timeout')`. Se a promessa em si falhar, repasse o erro dela. (`Promise.race`)
12. **R12** – `executarEmSequencia(tarefas)`: `tarefas` é um array de **funções** que devolvem Promises. Executa **uma de cada vez**, na ordem, e devolve os resultados em ordem. Se uma falhar, rejeita com o erro dela e as seguintes **não rodam**.
13. **R13** – `executarEmParalelo(tarefas)`: inicia **todas ao mesmo tempo** e devolve os resultados na **ordem original** (mesmo que terminem fora de ordem). Se uma falhar, rejeita com o erro dela. (`Promise.all`)
14. **R14** – `tratarErros(promessas)`: recebe um array de Promises e devolve `{ sucessos: [valores], falhas: [mensagens dos erros] }`, na ordem, **sem rejeitar nunca**. (`Promise.allSettled`)
15. **R15** – 🔥 `retry(fn, tentativas, atrasoMs)`: chama `fn` (função assíncrona); se falhar, espera e tenta de novo, até `tentativas` vezes. A espera **dobra a cada falha**: `atrasoMs`, `2 × atrasoMs`, `4 × atrasoMs`... Se der certo, devolve o valor; se todas falharem, rejeita com o **último** erro. Não espera depois da última tentativa.
16. **R16** – 🔥 `limitarConcorrencia(tarefas, limite)`: executa as tarefas (funções que devolvem Promises) com **no máximo `limite` rodando ao mesmo tempo**. Assim que uma termina, a próxima **já começa** (não espere o grupo inteiro). Devolve os resultados na ordem original; se uma falhar, rejeita com o erro dela. Funciona com lista vazia e com `limite` maior que o número de tarefas.
17. **R17** – 🔥 `EventEmitter`: `on(evento, fn)` e `off(evento, fn)` (devolvem `this`), `once(evento, fn)` (chama uma única vez), `emit(evento, ...args)` (chama os ouvintes na ordem em que foram registrados e devolve `true` se havia ouvintes, senão `false`) e `listenerCount(evento)`. Um ouvinte que se remove durante o `emit` não pode fazer o seguinte ser pulado.

<details>
<summary>💡 Dicas (abra só se travar)</summary>

**Nível 1 – Pensando antes de codar**
- **Classes:** pense em "o que esse objeto **guarda**" (campos) e "o que ele **sabe fazer**" (métodos). Um campo com `#` só existe **dentro** da classe: nem os filhos (subclasses) enxergam. Se a `ContaPoupanca` precisa registrar "juros" no extrato, a `ContaBancaria` precisa oferecer um método auxiliar para isso.
- **Erros customizados:** uma classe que `extends Error` precisa chamar `super(mensagem)` primeiro no construtor; depois você pode guardar outros campos.
- **Getter:** `get tamanho() { ... }` é usado **sem parênteses**: `pilha.tamanho`.
- **Gerador:** `function*` + `yield` entrega um valor e **pausa** até alguém pedir o próximo. É isso que permite uma sequência infinita sem estourar a memória. Para consumir só alguns itens, você precisa **parar** no momento certo.
- **Assíncrono:** `await` só funciona dentro de `async function`. Uma Promise é "um valor que vai chegar". Em `new Promise((resolve, reject) => ...)`, chamar `resolve(valor)` entrega o valor.
- **R15 (retry):** é um laço com `try/catch`: tenta; se der erro, guarda o erro, espera e repete. Lembre de repassar o último erro no fim.
- **R16 (concorrência):** em vez de dividir em grupos, imagine **N "trabalhadores"**. Cada um pega a próxima tarefa livre, executa, e volta pegar outra até acabarem as tarefas. Um índice compartilhado diz qual é a próxima.
- **R17:** guarde os ouvintes em um `Map` (evento → lista de funções). Ao emitir, percorra uma **cópia** da lista.

**Nível 2 – Ferramentas**
- Espera: `new Promise((resolve) => setTimeout(resolve, ms))`.
- `Promise.race([a, b])` termina quando a **primeira** terminar (use com uma Promise que rejeita depois de `ms`). Lembre de limpar o `setTimeout` (`clearTimeout`).
- `Promise.all`, `Promise.allSettled` (devolve `{ status: 'fulfilled', value }` ou `{ status: 'rejected', reason }`).
- Objeto iterável: um método `*[Symbol.iterator]() { yield* ... }` dentro da classe.
- Para dobrar o atraso: `atrasoMs * 2 ** i` (com `i` = número da falha, começando em 0).
- Um array com N posições para guardar os resultados por índice: `new Array(tarefas.length)`.
- Copiar uma lista antes de percorrer: `[...lista]`.
- 🪤 `JSON.stringify(conta)` só mostra propriedades públicas, e campos `#` nunca aparecem. Isso ajuda no R6.
</details>

---

## Como entregar

1. Clone o repositório: `git clone https://github.com/NicolasDimitri/web-10-js-avancado.git` e entre na pasta.
2. Crie uma branch: `git switch -c meu-projeto`
3. Abra o arquivo **`solucao.js`**: ele já vem com todas as funções/classes prontas para você preencher (troque o `throw` pelo seu código). **É o único arquivo que você edita.**
4. `git add .` → `git commit -m "mensagem"` → `git push -u origin meu-projeto`
5. No GitHub, clique em **Compare & pull request** → **Create pull request**.
6. A cada commit, o robô adiciona **um novo comentário** no PR com uma **tabela de requisitos** (✅ passou / ❌ não passou, com a dica do que falta) e a **porcentagem concluída**.
   Os comentários anteriores ficam como histórico do seu progresso. Corrija, faça novo commit + `git push` e uma nova tabela aparece.
7. Com tudo ✅, sua entrega está concluída. **O PR não será mesclado na `main`**: ele fica aberto só para a avaliação e para o instrutor revisar.

## Testar no seu computador (opcional, mas recomendado: o feedback é bem mais rápido!)

Você precisa do Node 22 instalado. **Não é preciso instalar navegador.**

```bash
npm install
npm test
```

Para fazer experimentos soltos, crie um arquivo `teste.js` (e não faça commit dele):

```js
const s = require('./solucao');
console.log(s.fizzBuzz(5));
```

e rode `node teste.js`.

> Não altere as pastas `tests/`, `scripts/` e `.github/`.
>
> ⏱️ Cada requisito roda isolado e com limite de tempo: se o seu código entrar em um laço infinito, só aquele requisito fica ❌ (com um aviso), e os outros continuam sendo avaliados.
