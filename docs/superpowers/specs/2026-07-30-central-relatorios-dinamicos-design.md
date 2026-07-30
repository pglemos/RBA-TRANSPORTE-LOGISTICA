# Design - Central Dinâmica de Relatórios RBA

**Data:** 2026-07-30  
**Branch:** `feat/central-relatorios-dinamicos`

## 1. Objetivo

Transformar `/relatorios` em uma central dinâmica, personalizada e orientada à decisão, capaz de gerar CSV, Excel e PDF conforme o período, filtros e modelo escolhidos pelo usuário.

O PDF premium estático produzido anteriormente passa a ser apenas referência visual. A implementação definitiva será gerada pelo sistema, com dados reais, componentes elásticos, paginação automática e seções condicionais.

## 2. Regra financeira imutável

A camada de relatórios não recalcula valores financeiros por ordem.

Os campos `cte_value`, `freight_value`, `advance_value`, `cash_value`, `balance_value`, `loading_expense`, `unloading_expense`, `other_expenses`, `total_expenses` e `net_value` serão lidos diretamente das ordens retornadas pela API.

São permitidas apenas operações gerenciais sobre esses valores persistidos:

- somas;
- contagens;
- médias;
- percentuais;
- rankings;
- participação relativa;
- variação entre períodos;
- concentração;
- recorrência;
- tendências.

Nenhum relatório poderá importar ou executar o motor financeiro das ordens.

## 3. Modelos de relatório

1. **Executivo geral**
   - visão consolidada;
   - indicadores financeiros e operacionais;
   - comparações;
   - principais clientes, motoristas e rotas;
   - insights e prioridades.

2. **Despesas**
   - carga, descarga, outros e total registrado;
   - participação por categoria;
   - evolução por período;
   - clientes, motoristas e rotas com maior despesa;
   - pontos de atenção e oportunidades de redução.

3. **Lucros**
   - líquido registrado;
   - margem gerencial sobre CTE;
   - lucro médio por operação;
   - evolução temporal;
   - ranking de clientes, motoristas e rotas;
   - operações positivas, neutras e negativas conforme o valor persistido.

4. **Clientes**
   - volume de operações;
   - valor CTE;
   - lucro registrado;
   - ticket médio;
   - participação e concentração;
   - recorrência;
   - comparação entre períodos.

5. **Motoristas**
   - quantidade de operações;
   - valor movimentado;
   - frete registrado;
   - despesas;
   - lucro registrado;
   - recorrência e status operacional.

6. **Rotas, origens e destinos**
   - rotas mais utilizadas;
   - origens e destinos predominantes;
   - valor CTE e lucro por rota;
   - recorrência;
   - concentração e oportunidades.

7. **Recorrência**
   - clientes recorrentes;
   - motoristas recorrentes;
   - rotas recorrentes;
   - combinações cliente + rota;
   - retenção e dependência comercial.

8. **Operações em andamento**
   - Contratar, Carregando e Em Trânsito;
   - valores envolvidos;
   - tempo em aberto quando houver datas válidas;
   - prioridades operacionais;
   - agrupamento por cliente, motorista e rota.

## 4. Períodos

O usuário poderá escolher:

- mês atual;
- mês anterior;
- um mês específico;
- ano atual;
- período personalizado.

A seleção de mês será convertida em `startDate` e `endDate`.

### Comparações

Para qualquer período serão calculados, quando houver dados:

- **período anterior equivalente**: intervalo imediatamente anterior com a mesma quantidade de dias;
- **mesmo período do ano anterior**: mesmas datas deslocadas em um ano.

Quando não houver dados suficientes, o relatório mostrará `Sem base comparável`, nunca uma variação enganosa.

## 5. Filtros

- cliente;
- motorista;
- status;
- origem;
- destino;
- busca textual;
- incluir ou não detalhamento das ordens;
- incluir ou não comparações;
- quantidade de itens nos rankings.

Os mesmos filtros devem ser aplicados ao período atual e às bases comparativas.

## 6. Insights

Os insights serão determinísticos e auditáveis, gerados a partir de regras explícitas. Não haverá texto inventado sem vínculo com os indicadores.

Categorias:

- ponto forte;
- destaque;
- ponto fraco;
- atenção;
- oportunidade;
- prioridade sugerida.

Exemplos de regras:

- crescimento ou queda relevante contra o período anterior;
- crescimento ou queda contra o ano anterior;
- concentração excessiva em poucos clientes;
- rota ou motorista com alta recorrência;
- despesas crescendo acima do valor CTE;
- margem registrada em queda;
- operações em andamento com participação elevada;
- ausência de base comparativa;
- diversificação comercial positiva.

Cada insight deve informar o indicador que o originou.

## 7. Formatos de exportação

### CSV

- base detalhada compatível com Excel;
- UTF-8 BOM;
- delimitador `;`;
- CRLF;
- proteção contra fórmulas;
- colunas variáveis conforme o modelo quando necessário;
- uma versão detalhada das ordens para auditoria.

### Excel (`.xlsx`)

Workbook com abas:

1. `Resumo Executivo`;
2. aba específica do modelo escolhido;
3. `Comparações`;
4. `Insights`;
5. `Base de Ordens`.

O arquivo terá identidade RBA, congelamento de cabeçalho, autofiltro, formatos monetários, larguras calculadas com limites seguros e quebra de texto.

### PDF

- A4 horizontal para relatórios analíticos e detalhados;
- capa e resumo executivo;
- seções condicionais conforme o modelo;
- cards sem altura fixa;
- textos com quebra natural;
- nenhuma reticência na impressão;
- tabelas com colunas específicas por modelo;
- cabeçalhos repetidos;
- blocos indivisíveis apenas quando couberem na página;
- rodapé com período, filtros e fonte dos dados;
- opção de incluir ou remover o detalhamento das ordens.

## 8. Estratégia contra componentes quebrados

- remover alturas fixas de cards e caixas de insight;
- usar `min-width: 0` em todos os filhos de grid e flex;
- usar `overflow-wrap: anywhere` apenas em referências e textos longos;
- limitar títulos por tamanho tipográfico responsivo, não por corte;
- rankings em linhas fluidas;
- tabelas diferentes para tela e impressão;
- não tentar colocar todas as colunas financeiras em todos os modelos;
- cada modelo exibirá apenas as colunas essenciais;
- páginas de detalhamento serão separadas do resumo;
- validação visual com textos extremos e grande quantidade de registros.

## 9. Arquitetura proposta

- `lib/reporting/types.ts`: contratos e enums;
- `lib/reporting/periods.ts`: períodos e comparações;
- `lib/reporting/analytics.ts`: agregações somente leitura;
- `lib/reporting/insights.ts`: regras de insights;
- `lib/reporting/csv.ts`: exportação CSV;
- `lib/reporting/excel.ts`: workbook Excel;
- `components/reports/ReportBuilder.tsx`: seleção de modelo e filtros;
- `components/reports/ReportDashboard.tsx`: visualização em tela;
- `components/reports/ReportPrintDocument.tsx`: documento imprimível;
- `app/relatorios/page.tsx`: orquestração.

A implementação poderá reutilizar `lib/reportExport.ts` durante a migração, mas o contrato final ficará no namespace `lib/reporting`.

## 10. Critérios de aceite

- filtros e períodos alteram tela, CSV, Excel e PDF da mesma forma;
- comparações usam intervalos equivalentes;
- nenhum valor por ordem é recalculado;
- todos os modelos possuem indicadores e insights específicos;
- PDF sem textos ou componentes cortados;
- Excel com abas e formatação válidas;
- CSV estruturalmente consistente;
- testes unitários cobrindo períodos, agregações, comparações e insights;
- build de produção aprovado;
- validação visual com dados reais e casos extremos.
