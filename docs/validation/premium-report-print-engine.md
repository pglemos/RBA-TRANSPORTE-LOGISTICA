# Validação do Motor Premium de Impressão

## Referência obrigatória

A validação usa como contrato visual o relatório premium aprovado com 16 páginas e 119 registros operacionais.

## Cenário reproduzido

- 119 registros reais da base CSV fornecida;
- relatório executivo geral;
- detalhamento operacional habilitado;
- textos extensos de clientes, motoristas, CTEs, origens e destinos;
- página A4 horizontal;
- impressão com Chromium e fundo gráfico habilitado.

## Resultado estrutural

- páginas geradas: **16**;
- tamanho físico: **A4 horizontal, 841,92 x 594,96 pontos**;
- páginas executivas: **10**;
- páginas de apêndice: **6**;
- registros por página de apêndice: **até 20**;
- página vazia final: **não**;
- conteúdo fora da folha: **não identificado**;
- cabeçalhos e rodapés: **presentes em todas as páginas**;
- tabela operacional: **cabeçalho repetido e status semântico**.

## Conteúdo executivo validado

1. capa institucional;
2. painel da Diretoria;
3. resultado financeiro;
4. execução operacional;
5. carteira de clientes;
6. inteligência de malha;
7. capacidade da rede de motoristas;
8. evolução temporal;
9. insights e prioridades;
10. governança, integridade e rastreabilidade;
11. a 16. apêndice operacional paginado.

## Correções em relação ao gerador anterior

- removido o documento HTML contínuo de cinco páginas;
- eliminada a primeira folha sobrecarregada;
- eliminada a segunda folha quase vazia;
- removida a tipografia executiva de 5 a 7 pontos usada para compactar assuntos incompatíveis;
- cada assunto estratégico passou a ocupar uma página própria;
- gráficos e rankings passaram a ser vetoriais e dinâmicos;
- o gráfico temporal usa escala comum para evitar distorção entre as séries;
- o apêndice passou a ter limite determinístico de linhas por página.

## Integridade financeira

O motor de impressão não recalcula valores por ordem. CTE, frete, adiantamento, pagamento à vista, saldo, despesas e lucro líquido são reproduzidos dos campos retornados pela API. Somente consolidações, médias, percentuais, rankings e comparações são calculados para apresentação gerencial.

## Conclusão

O cenário de referência foi aprovado estrutural e visualmente para integração. A confirmação final de produção deverá usar o PDF baixado da rota autenticada após o deploy do commit de merge.
