const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 20000,
  expect: { timeout: 3000 },
  globalTimeout: 150000,     // trava de segurança: a avaliação inteira nunca passa de 2,5 min
  fullyParallel: true,
  reporter: process.env.CI
    ? [['list'], ['github'], ['json', { outputFile: 'resultado.json' }]]
    : [['list']],
});
