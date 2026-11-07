'use strict';
// Escreva suas soluções neste arquivo. Cada classe/função está pronta para ser implementada:
// troque o "throw" pelo seu código. Leia o README para ver exemplos e os requisitos.

// ---------- Classes ----------

/** Erro lançado quando o saque é maior que o saldo. Guarda saldoAtual e valorSolicitado. */
class SaldoInsuficienteError extends Error {
  constructor(saldoAtual, valorSolicitado) {
    super('Classe ainda não implementada');
    throw new Error('Classe ainda não implementada');
  }
}

/** Conta com saldo privado (#saldo): titular, saldo (getter), depositar, sacar, extrato. */
class ContaBancaria {
  constructor(titular, saldoInicial = 0) {
    throw new Error('Classe ainda não implementada');
  }
}

/** Conta poupança: herda de ContaBancaria, rende juros e limita os saques. */
class ContaPoupanca extends ContaBancaria {
}

/** Pilha (LIFO): empilhar, desempilhar, topo, vazia, tamanho (getter). */
class Pilha {
  constructor() {
    throw new Error('Classe ainda não implementada');
  }
}

/** Fila (FIFO): enfileirar, desenfileirar, frente, vazia, tamanho (getter) e iterável. */
class Fila {
  constructor() {
    throw new Error('Classe ainda não implementada');
  }
}

/** 🔥 Emissor de eventos: on, once, off, emit, listenerCount. */
class EventEmitter {
  constructor() {
    throw new Error('Classe ainda não implementada');
  }
}

// ---------- Geradores ----------

/** function* que gera 0, 1, 1, 2, 3, 5, 8... para sempre */
function* fibonacci() {
  throw new Error('Função ainda não implementada');
}

/** primeiros(fibonacci(), 5) -> [0, 1, 1, 2, 3]  (funciona com qualquer iterável) */
function primeiros(iteravel, n) {
  throw new Error('Função ainda não implementada');
}

// ---------- Assíncronas ----------

/** await esperar(1000)  -> espera 1 segundo */
function esperar(ms) {
  throw new Error('Função ainda não implementada');
}

/** buscarComTimeout(promessa, 2000) -> rejeita com Error('Timeout') se passar de 2s */
function buscarComTimeout(promessa, ms) {
  throw new Error('Função ainda não implementada');
}

/** executarEmSequencia([() => promessa1, () => promessa2]) -> [r1, r2], uma de cada vez */
function executarEmSequencia(tarefas) {
  throw new Error('Função ainda não implementada');
}

/** executarEmParalelo([() => promessa1, () => promessa2]) -> [r1, r2], todas juntas */
function executarEmParalelo(tarefas) {
  throw new Error('Função ainda não implementada');
}

/** tratarErros([ok, falha, ok]) -> { sucessos: [...valores], falhas: [...mensagens] } */
function tratarErros(promessas) {
  throw new Error('Função ainda não implementada');
}

/** 🔥 retry(fn, 3, 100) -> tenta até 3 vezes, esperando 100ms, 200ms, 400ms... entre as tentativas */
function retry(fn, tentativas, atrasoMs) {
  throw new Error('Função ainda não implementada');
}

/** 🔥 limitarConcorrencia(tarefas, 2) -> roda no máximo 2 tarefas por vez; resultados na ordem original */
function limitarConcorrencia(tarefas, limite) {
  throw new Error('Função ainda não implementada');
}

module.exports = {
  ContaBancaria, SaldoInsuficienteError, ContaPoupanca, Pilha, Fila, fibonacci, primeiros,
  esperar, buscarComTimeout, executarEmSequencia, executarEmParalelo, tratarErros,
  retry, limitarConcorrencia, EventEmitter,
};
