# Motor Premium de Relatórios para Diretoria - Design

## Status e referência obrigatória

O PDF `RBA_Relatorio_Executivo_Premium_Diretoria.pdf`, com 16 páginas para 119 operações, é o contrato visual e editorial obrigatório. Os PDFs de cinco páginas gerados pelo navegador representam a falha a ser eliminada.

## Problema raiz

O componente atual renderiza um único documento HTML contínuo. Todas as seções executivas são empilhadas em fluxo normal e o navegador decide as quebras. Isso comprime vários assuntos na primeira folha, deixa páginas parcialmente vazias e transforma o detalhamento em uma tabela minúscula. A validação anterior conferiu build, dados e ausência de overflow, mas não conferiu paridade com o documento aprovado.

## Objetivo

Substituir o fluxo contínuo por um motor de composição explícita em páginas A4 horizontais, com narrativa de diretoria, identidade RBA, gráficos, indicadores, insights, governança e apêndice operacional paginado.

## Arquitetura

### 1. Planejador de páginas puro

`lib/reporting/printLayout.ts` define:

- sequência de páginas por tipo de relatório;
- quantidade fixa de linhas por página de apêndice;
- paginação determinística;
- títulos e chaves estáveis das páginas;
- regra de inclusão do detalhamento.

Esse módulo não conhece React, navegador ou CSS e será coberto por testes unitários.

### 2. Componentes de impressão isolados

`components/reports/print/PrintPrimitives.tsx` contém páginas, cabeçalhos, rodapés, cards, barras, gráficos SVG e tabelas.

`components/reports/print/ExecutivePrintPages.tsx` reproduz a narrativa premium:

1. capa institucional;
2. painel da diretoria;
3. resultado financeiro;
4. execução operacional;
5. carteira de clientes;
6. inteligência de malha;
7. capacidade de transporte;
8. evolução temporal;
9. agenda executiva;
10. governança e rastreabilidade.

`components/reports/print/ModelPrintPages.tsx` monta páginas específicas para Despesas, Lucros, Clientes, Motoristas, Rotas, Recorrência e Operações em andamento.

`components/reports/print/AppendixPages.tsx` divide as ordens em páginas de até 20 linhas, repete cabeçalho, mostra intervalo de registros e usa colunas específicas por modelo.

`components/reports/ReportPrintDocument.tsx` apenas orquestra o plano e os componentes.

### 3. Contrato CSS de página física

`app/relatorios/reporting.css` usará:

- `@page { size: A4 landscape; margin: 0; }`;
- cada `.rba-print-page` com `width: 297mm`, `height: 210mm` e `break-after: page`;
- padding interno próprio;
- nenhuma seção executiva dependendo de quebra automática;
- tipografia mínima legível;
- cores navy, dourado, cinza e semânticas da RBA;
- elementos gráficos em CSS/SVG, sem dependência de canvas;
- última página sem quebra extra.

## Regras dinâmicas

- Todos os valores vêm do `GeneratedReport` filtrado pelo usuário.
- O período, filtros, comparações e ranking são dinâmicos.
- O relatório não recalcula ordens individualmente.
- Sem histórico, a comparação mostra `Sem base`.
- Relatório executivo com detalhamento: 10 páginas executivas + `ceil(ordens / 20)` páginas de apêndice.
- Para 119 ordens, o resultado deve ter 16 páginas, igual à referência aprovada.
- Para 85 ordens, o resultado deve ter 15 páginas.
- Relatórios temáticos têm capa, painel, páginas específicas, insights, governança e apêndice opcional.
- Operações em andamento sempre incluem o detalhamento aberto.

## Requisitos visuais

- Capa com fundo navy, marca RBA, título grande, três indicadores e período.
- Uma mensagem executiva por página, sem misturar cinco assuntos em uma folha.
- Cards com hierarquia e respiro equivalentes ao PDF premium.
- Gráfico temporal vetorial com séries de CTE e lucro/despesa conforme o modelo.
- Rankings em barras horizontais, não apenas tabelas compactas.
- Página de insights com prioridades numeradas e evidências.
- Página de governança explicando fonte, rastreabilidade e não recálculo.
- Apêndice com até 20 linhas por página e rodapé numerado.

## Testes e validação

### Testes automatizados

- executivo com 119 ordens gera 16 páginas;
- executivo com 85 ordens gera 15 páginas;
- sem detalhamento gera somente páginas executivas;
- operações em andamento sempre geram apêndice;
- paginação não cria páginas vazias;
- todos os modelos têm capa, insights e governança;
- CSS contém página física A4 e quebra explícita.

### Validação visual obrigatória

- gerar PDF real do navegador;
- renderizar todas as páginas em PNG;
- comparar lado a lado com a referência premium;
- verificar capa, hierarquia, gráficos, tabelas, rodapés e ausência de páginas desperdiçadas;
- só mesclar no `main` após o PDF real passar nessa inspeção.

## Critérios de aceite

- O PDF do sistema deve parecer uma apresentação para diretoria, não uma impressão de dashboard.
- Nenhuma página executiva pode ter tipografia minúscula para acomodar conteúdo excessivo.
- Nenhuma página pode ficar majoritariamente vazia por erro de fluxo.
- Não pode haver texto cortado, sobreposto ou fora da A4.
- O resultado deve manter identidade e narrativa equivalentes ao PDF premium aprovado.
