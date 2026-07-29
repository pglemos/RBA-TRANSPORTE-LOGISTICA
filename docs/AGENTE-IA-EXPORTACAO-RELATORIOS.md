# Instruções para Agente de IA - Exportação de Relatórios RBA

## Objetivo

Manter a exportação CSV e o relatório executivo em PDF da rota `/relatorios` corretos, consistentes com os dados reais do sistema e visualmente adequados para apresentação à diretoria.

## Regra financeira obrigatória

O relatório não é um motor de cálculo financeiro.

Os campos abaixo devem ser lidos diretamente dos objetos retornados por `/api/orders`:

- `cte_value`;
- `freight_value`;
- `advance_value`;
- `cash_value`;
- `balance_value`;
- `loading_expense`;
- `unloading_expense`;
- `other_expenses`;
- `total_expenses`;
- `net_value`.

É permitido somar, contar, calcular média gerencial e percentual para formar indicadores consolidados. É proibido recalcular o valor financeiro de uma viagem, substituir campos gravados ou importar `calculateFreightOrderFinancials` e `summarizeFreightOrders` dentro da camada de relatório.

As regras financeiras permanecem no fluxo de ordens, banco, funções e tabelas já adotados pelo sistema.

## Arquivos principais

- `app/relatorios/page.tsx`: interface, filtros, download CSV e documento de impressão;
- `lib/reportExport.ts`: mapeamento somente leitura, consolidação e serialização CSV;
- `tests/reportExport.test.ts`: contrato automatizado da exportação;
- `components/RBALogo.tsx`: logo real e imprimível;
- `app/globals.css`: contrato A4 landscape e paginação;
- `lib/freightOrderDates.ts`: leitura e formatação da data de emissão;
- `lib/freightStatus.ts`: normalização oficial dos status.

## Processo obrigatório de alteração

1. Trabalhe em branch isolada.
2. Leia os arquivos atuais antes de editar.
3. Reproduza o defeito com dados reais ou com o CSV de validação.
4. Escreva ou atualize um teste que falhe pelo motivo esperado.
5. Implemente a menor correção que resolva a causa.
6. Execute os testes e o build.
7. Gere CSV e PDF pela tela real `/relatorios`.
8. Valide o CSV por parser, não apenas abrindo visualmente.
9. Renderize todas as páginas do PDF como imagem e examine cada página.
10. Corrija qualquer falha e repita todo o ciclo.
11. Integre no `main` somente após a validação completa.

## Comandos mínimos

```bash
npm ci
npm run test:report
npm run build
```

Para renderizar o PDF:

```bash
python /home/oai/skills/pdfs/scripts/render_pdf.py \
  "relatorio-executivo-rba-AAAA-MM-DD.pdf" \
  --out_dir /tmp/rba-relatorio-render \
  --dpi 200
```

Para comparar com uma versão anterior:

```bash
python /home/oai/skills/pdfs/scripts/compare_renders.py \
  "relatorio-anterior.pdf" \
  "relatorio-executivo-rba-AAAA-MM-DD.pdf" \
  --out_dir /tmp/rba-relatorio-diff \
  --dpi 200
```

## Contrato do CSV

- BOM UTF-8 presente;
- delimitador `;`;
- quebra de linha CRLF;
- 21 colunas em todas as linhas;
- números monetários com duas casas e vírgula decimal;
- textos devidamente escapados;
- fórmulas de planilha neutralizadas quando o primeiro caractere útil for `=`, `+`, `-` ou `@`;
- uma linha por ordem filtrada;
- arquivo apenas com cabeçalho quando o filtro estiver vazio.

## Checklist visual do PDF

- formato A4 horizontal;
- logo RBA presente e nítida;
- título, horário e metadados completos;
- filtros aplicados legíveis;
- indicadores sem sobreposição;
- valores alinhados à direita;
- cabeçalho da tabela repetido nas páginas seguintes;
- textos longos quebrados, nunca cortados por reticências;
- status completos, incluindo `Em Trânsito`;
- nenhuma coluna fora da página;
- nenhuma linha sobreposta;
- nenhuma página final quase vazia causada por margens ou rodapé;
- bloco de fonte dos dados e assinaturas presente ao final;
- identidade RBA preservada em preto, branco, dourado e estados semânticos discretos.

## Critérios de rejeição

Rejeite a alteração e continue corrigindo quando ocorrer qualquer item abaixo:

- divergência entre o CSV, o PDF e os valores retornados pela API;
- inclusão de uma nova fórmula financeira no relatório;
- ausência da logo;
- coluna com quantidade diferente de campos;
- caracteres quebrados no Excel;
- texto cortado, sobreposto ou ilegível;
- tabela ultrapassando a folha;
- status abreviado ou truncado;
- build ou teste falhando;
- validação realizada apenas por inspeção do código.

## Frase única para execução pelo agente

> Aplique integralmente o código deste repositório, preserve os valores financeiros retornados pela API sem recalculá-los, execute os testes e o build, gere CSV e PDF reais pela tela `/relatorios`, valide todos os arquivos visualmente e por estrutura e somente conclua quando não houver cortes, sobreposições, colunas inconsistentes ou divergência de dados.