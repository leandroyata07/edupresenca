# EduPresença v2 — Manual de Funcionalidades

> **Versão:** 2.0 &nbsp;|&nbsp; **Data:** Fevereiro de 2026  
> Sistema de gerenciamento de presenças e notas escolares — PWA Offline-First

---

## Sumário

| # | Funcionalidade | Seção |
|---|---------------|-------|
| 1 | Boletim do Aluno | [→](#1-boletim-do-aluno) |
| 2 | Alertas de Frequência | [→](#2-alertas-de-frequência) |
| 3 | Ações Rápidas no Dashboard | [→](#3-ações-rápidas-no-dashboard) |
| 4 | Desfazer Exclusão | [→](#4-desfazer-exclusão-undo) |
| 5 | Busca Global | [→](#5-busca-global-ctrlk) |
| 6 | Importação CSV de Alunos | [→](#6-importação-csv-de-alunos) |
| 7 | Justificativa de Ausência | [→](#7-justificativa-de-ausência) |
| 8 | Fórmula de Média Configurável | [→](#8-fórmula-de-média-configurável) |
| 9 | Exportação PDF de Relatórios | [→](#9-exportação-pdf-de-relatórios) |
| 10 | Ranking de Turmas | [→](#10-ranking-de-turmas) |
| 11 | Calendário de Presenças | [→](#11-calendário-de-presenças) |
| 12 | Skeleton Loading | [→](#12-skeleton-loading) |
| 13 | Auto-save de Rascunho | [→](#13-auto-save-de-rascunho) |
| 14 | Atalhos de Teclado | [→](#14-atalhos-de-teclado) |
| 15 | Aviso de Saída | [→](#15-aviso-de-saída) |
| 16 | Backup & Restauração | [→](#16-backup--restauração) |
| 17 | Gráfico de Evolução de Notas | [→](#17-gráfico-de-evolução-de-notas) |
| 18 | Lista de Chamada Imprimível | [→](#18-lista-de-chamada-imprimível) |
| 19 | Tabelas Responsivas Mobile | [→](#19-tabelas-responsivas-mobile) |

---

## 1. Boletim do Aluno

**Arquivo:** `js/pages/boletim.js` · `js/pages/alunos.js`

### O que faz
Exibe um boletim completo do aluno em um modal, mostrando:
- Dados pessoais (nome, turma, curso, unidade, data de nascimento, CPF, e-mail)
- Frequência global e por turma, com barra de progresso colorida (verde ≥75%, vermelho <75%)
- Tabela de notas por disciplina × bimestre, com média ponderada configurável
- Situação por disciplina (Aprovado / Recuperação / Reprovado) com badges coloridos
- Situação geral do aluno
- Gráfico de evolução das notas (ver [item 17](#17-gráfico-de-evolução-de-notas))
- Botão "Imprimir / PDF" que gera um documento pronto para impressão

### Como usar
1. Acesse **Alunos** no menu lateral
2. Localize o aluno desejado na tabela
3. Clique no botão **📋 Boletim** na linha do aluno
4. O modal abre com todas as informações; clique em **Imprimir / PDF** para salvar

### Detalhes técnicos
- Disciplinas são coletadas de três fontes: notas já lançadas, disciplinas do curso, e kadatros de disciplinas
- Médias usam pesos configurados em **Configurações → Sistema → Fórmula de Média**
- A impressão abre uma nova janela com HTML limpo e chama `window.print()` automaticamente

---

## 2. Alertas de Frequência

**Arquivo:** `js/app.js` · `js/components/sidebar.js` · `js/pages/dashboard.js`

### O que faz
- **Badge vermelho** na sidebar, no item "Alunos", exibindo o número de alunos com frequência abaixo de 75%
- **Card "Alunos em Risco"** no Dashboard listando esses alunos por nome, turma e percentual de frequência
- O badge é recalculado automaticamente a cada navegação entre páginas

### Como usar
- O badge aparece automaticamente quando há alunos em risco
- No Dashboard, o card "Alunos em Risco" exibe a lista completa com frequência real
- Zero alunos → badge não é exibido

### Critérios
- Aluno deve estar com situação **Ativo**
- Mínimo de **3 registros de presença** para ser considerado
- Frequência calculada como `(presenças / total de aulas registradas) × 100`

---

## 3. Ações Rápidas no Dashboard

**Arquivo:** `js/pages/dashboard.js` · `js/pages/presenca.js`

### O que faz
Cada turma cadastrada exibe um bloco de "Ações Rápidas" no Dashboard com botões:
- **Registrar Presença** → navega direto para a tela de presença com a turma pré-selecionada
- **Lançar Notas** → navega direto para a tela de notas com a turma pré-selecionada
- **Ver Alunos** → filtra a lista de alunos para a turma selecionada

### Como usar
1. Acesse o **Dashboard**
2. Localize o card da turma desejada
3. Clique em um dos botões de ação — a navegação e seleção acontecem automaticamente

### Detalhes técnicos
- A pré-seleção usa `sessionStorage` com a chave `edu_quick_presenca` ou `edu_quick_notas`
- A página de destino lê o valor ao carregar e aplica a seleção antes de qualquer interação do usuário

---

## 4. Desfazer Exclusão (Undo)

**Arquivo:** `js/utils.js` · `js/components/toast.js` · `js/store.js`

### O que faz
Ao excluir qualquer registro (aluno, turma, curso, disciplina, unidade, turno), em vez de um diálogo de confirmação bloqueante, o sistema:
1. Exclui o item imediatamente
2. Exibe um **toast de aviso** com um botão **↩ Desfazer** por 5,5 segundos
3. Se o usuário clicar em "Desfazer", o item é restaurado com todos os seus dados originais

### Como usar
- Em qualquer tabela de registros, clique no ícone de **lixeira**
- O item desaparece da lista e aparece o toast com o botão de desfazer
- Clique em **↩ Desfazer** dentro de 5 segundos para restaurar

### Detalhes técnicos
- Função `deleteWithUndo(store, item, displayName, onRefresh)` em `utils.js`
- O método `store.restore(item)` garante que o item volta com o mesmo `id` e `createdAt`
- O toast é gerenciado pelo componente `<app-toast>` via método `showWithAction()`

---

## 5. Busca Global (Ctrl+K)

**Arquivo:** `js/components/search.js` · `js/app.js`

### O que faz
Uma paleta de busca rápida (estilo Command Palette) que pesquisa em tempo real:
- **Páginas do sistema** (Dashboard, Alunos, Turmas, etc.)
- **Alunos cadastrados** (por nome e e-mail)
- **Turmas cadastradas** (por nome)

### Como usar
- Pressione **Ctrl+K** (Windows/Linux) ou **⌘+K** (Mac) em qualquer página
- A paleta abre com um campo de busca já focado
- Digite para filtrar; use **↑ ↓** para navegar, **Enter** para abrir, **Esc** para fechar
- Também pode clicar em um resultado com o mouse

### Detalhes técnicos
- `initSearch()` é chamado em `app.js` após o login
- O índice de alunos e turmas é recarregado a cada abertura da paleta, refletindo dados recentes
- Resultados são agrupados por categoria (Páginas / Alunos / Turmas)

---

## 6. Importação CSV de Alunos

**Arquivo:** `js/pages/alunos.js`

### O que faz
Permite importar uma lista de alunos a partir de um arquivo **CSV**, reconhecendo automaticamente as colunas por nome de cabeçalho.

### Como usar
1. Acesse **Alunos**
2. Clique em **Importar CSV** (cabeçalho da página)
3. Selecione um arquivo `.csv` no gerenciador de arquivos
4. O sistema importa os alunos válidos e exibe um resumo (importados / ignorados)

### Formato esperado do CSV
O arquivo deve ter uma linha de cabeçalho. As colunas são detectadas pelo nome (não precisa ser exato):

| Coluna detectada | Exemplos aceitos |
|---|---|
| Nome (obrigatório) | `nome`, `Nome Completo` |
| E-mail | `email`, `e-mail` |
| Turma | `turma`, `Turma/Classe` |
| Matrícula | `matricula`, `mat` |
| Data de Nascimento | `nascimento`, `data_nasc` |
| Telefone | `telefone`, `fone`, `tel` |
| Situação | `situacao` (`ativo` ou `inativo`) |

- Separadores aceitos: vírgula (`,`) ou ponto-e-vírgula (`;`)
- Campos com aspas (`"`) são respeitados
- Linhas sem nome são ignoradas
- A coluna "Turma" pode conter o nome ou o ID da turma — o sistema resolve automaticamente

---

## 7. Justificativa de Ausência

**Arquivo:** `js/pages/presenca.js` · `js/store.js`

### O que faz
Ao marcar um aluno como **ausente** no registro de presença, um campo de texto aparece para adicionar uma justificativa opcional (ex.: "Atestado médico", "Viagem").

### Como usar
1. Acesse **Presença**, selecione a turma e a data
2. Clique em **✗ Ausente** para algum aluno — o campo de justificativa aparece abaixo
3. Digite a justificativa e salve normalmente com **Salvar presença**

### Detalhes técnicos
- A justificativa é armazenada junto ao registro de presença no campo `justificativa`
- É exibida no histórico de presenças
- O campo some automaticamente se o aluno for marcado como presente novamente

---

## 8. Fórmula de Média Configurável

**Arquivo:** `js/pages/configuracoes.js` · `js/pages/boletim.js`

### O que faz
Permite definir o **peso de cada bimestre** no cálculo da média final do aluno. Por padrão todos os bimestres têm peso 1 (média simples). Pode-se, por exemplo, dar mais peso ao 4º bimestre.

### Como usar
1. Acesse **Configurações → aba Sistema**
2. No card "Fórmula de Média", ajuste os pesos dos 4 bimestres
3. O total e a porcentagem de influência de cada bimestre são mostrados em tempo real
4. Clique em **Salvar pesos**; clique em **Restaurar padrão** para voltar a pesos iguais

### Fórmula
```
Média = (N1×P1 + N2×P2 + N3×P3 + N4×P4) / (P1 + P2 + P3 + P4)
```
Onde `Ni` = nota do bimestre `i` e `Pi` = peso do bimestre `i`.

### Detalhes técnicos
- Pesos salvos em `edu_config.pesoBimestres` no localStorage
- Boletim e PDF usam os mesmos pesos configurados; bimestres sem nota são excluídos do cálculo

---

## 9. Exportação PDF de Relatórios

**Arquivo:** `js/pages/relatorios.js`

### O que faz
O botão **Imprimir / Exportar PDF** na página de Relatórios gera uma versão limpa e formatada do relatório selecionado, adequada para impressão ou salvamento como PDF via diálogo nativo do browser.

### Como usar
1. Acesse **Relatórios** no menu lateral
2. Selecione o tipo de relatório e os filtros desejados
3. Clique em **Imprimir / Exportar PDF**
4. Uma nova janela abre com o relatório formatado e o diálogo de impressão é acionado automaticamente
5. No diálogo, escolha "Salvar como PDF" (Chrome/Brave/Edge) ou a impressora desejada

### Detalhes técnicos
- Implementado via `exportarPDF()` que constrói um documento HTML completo com estilos inline otimizados para impressão
- A nova janela fecha automaticamente após o diálogo de impressão
- Se pop-ups estiverem bloqueados, um toast orienta o usuário a permitir

---

## 10. Ranking de Turmas

**Arquivo:** `js/pages/dashboard.js`

### O que faz
Um card no Dashboard exibe o **ranking de frequência das turmas**, ordenado da maior para a menor frequência média, com medalhas para as 3 primeiras.

### Como usar
- O card aparece automaticamente no Dashboard quando há turmas com registros de presença
- Exibe: posição (🥇🥈🥉 para o pódio), nome da turma, barra de progresso e percentual

### Detalhes técnicos
- Calculado sobre todos os registros de presença de cada turma
- Turmas sem nenhum registro são excluídas do ranking
- Atualizado a cada visita ao Dashboard

---

## 11. Calendário de Presenças

**Arquivo:** `js/pages/presenca.js`

### O que faz
Na página de Presença, ao selecionar uma turma, exibe um **calendário mensal** mostrando os dias com registros:
- 🟢 Verde: frequência ≥ 75% naquele dia
- 🔴 Vermelho: frequência < 75%
- Percentual numérico em cada célula com registro
- Navegação entre meses (anterior / próximo / hoje)

### Como usar
1. Acesse **Presença**
2. Selecione uma turma no dropdown — o calendário aparece automaticamente
3. Clique em qualquer dia com registro para carregá-lo diretamente no formulário de presença
4. Use os botões **‹** e **›** para navegar entre meses

---

## 12. Skeleton Loading

**Arquivo:** `js/router.js`

### O que faz
Enquanto o módulo JavaScript de uma página está sendo carregado (lazy-load), exibe **placeholders animados com efeito shimmer** no lugar do conteúdo, evitando uma tela em branco.

### Comportamento
- Aparece automaticamente entre navegações enquanto o módulo da página carrega
- Exibe blocos de altura variada que imitam o layout de cards e tabelas
- Substitui uma barra de progresso estática por uma experiência visual mais rica
- Desaparece instantaneamente quando o conteúdo real é renderizado

### Detalhes técnicos
- Implementado em `_showSkeleton(outlet)` no router
- A animação `@keyframes sk-shimmer` é injetada uma única vez via `_injectSkeletonStyles()`
- Compatível com tema claro e escuro via variáveis CSS

---

## 13. Auto-save de Rascunho

**Arquivo:** `js/utils.js` · `js/pages/crud.js` · `js/pages/alunos.js`

### O que faz
Formulários de cadastro/edição salvam automaticamente o conteúdo digitado no **localStorage** enquanto o usuário preenche. Se a página for fechada acidentalmente ou o browser travar, o rascunho é restaurado na próxima abertura do mesmo formulário.

### Comportamento
- **Formulário "Novo Aluno"**: rascunho salvo sob a chave `edu_draft_aluno-novo`
- **Formulário de edição**: rascunho por item (`edu_draft_aluno-edit-{id}`)
- **Todos os CRUDs genéricos** (Turmas, Cursos, Disciplinas, etc.): mesma lógica
- Ao **Salvar** ou **Cancelar** com sucesso, o rascunho é limpo automaticamente
- O rascunho também define `window._formDirty = true`, ativando o [Aviso de Saída](#15-aviso-de-saída)

### API interna (`formDraft` em `utils.js`)
| Método | Descrição |
|--------|-----------|
| `formDraft.save(key, formEl)` | Persiste todos os campos `[name]` do formulário |
| `formDraft.restore(key, formEl)` | Preenche o formulário com os dados salvos |
| `formDraft.clear(key)` | Remove o rascunho e reseta `_formDirty` |
| `formDraft.has(key)` | Verifica se existe rascunho para a chave |

---

## 14. Atalhos de Teclado

**Arquivo:** `js/components/shortcuts.js` · `js/app.js`

### O que faz
Atalhos globais que funcionam em qualquer página do sistema após o login.

### Tabela de atalhos

| Tecla | Ação |
|-------|------|
| `N` | Abre o formulário "Novo registro" da página atual |
| `F` | Foca o campo de pesquisa/filtro da página |
| `Ctrl+S` | Salva o modal aberto (equivale a clicar no botão "Salvar") |
| `Ctrl+K` | Abre a busca global |
| `?` | Exibe um toast com todos os atalhos disponíveis |

### Regras de ativação
- `N` e `F` só funcionam quando **nenhum input/textarea está focado** e **nenhum modal está aberto**
- `Ctrl+S` funciona sempre que um modal estiver aberto, independente do foco
- Na **primeira vez** que o sistema é iniciado após o login, um toast aparece informando que atalhos estão disponíveis (apenas uma vez, registrado no localStorage)

---

## 15. Aviso de Saída

**Arquivo:** `js/router.js`

### O que faz
Se o usuário tentar **navegar para outra página** (via sidebar, busca global ou botão voltar do browser) enquanto um formulário está com dados não salvos, exibe uma caixa de confirmação:

> *"Há alterações não salvas. Deseja sair mesmo assim?"*

### Comportamento
- Clique em **OK**: a navegação prossegue e o rascunho é mantido no localStorage
- Clique em **Cancelar**: o usuário permanece na página atual
- Disparado automaticamente pelo [Auto-save](#13-auto-save-de-rascunho) quando `window._formDirty = true`
- `_formDirty` é resetado para `false` automaticamente quando a nova página termina de renderizar

---

## 16. Backup & Restauração

**Arquivo:** `js/pages/configuracoes.js`

### O que faz
A aba **Backup & Restauração** em Configurações oferece três formas de salvar e recuperar todos os dados do sistema:

#### Backup Local (JSON)
- Exporta todos os dados (alunos, turmas, presenças, notas, cursos, unidades, turnos, configurações) para um arquivo `.json` no computador
- O arquivo recebe o nome `edupresenca-backup-YYYY-MM-DD.json`
- O painel mostra: **último backup realizado**, total de registros, uso de armazenamento e contagem por entidade

#### Restaurar de arquivo
- Selecione um arquivo `.json` gerado pelo EduPresença
- Uma caixa de confirmação exibe a data do backup antes de sobrescrever os dados
- Após restaurar, o sistema recarrega automaticamente

#### Google Drive
- Salva e restaura backups diretamente no Google Drive via OAuth2
- Requer configurar o **Client ID do Google Cloud** no campo indicado
- O sistema encontra automaticamente o backup mais recente ao restaurar

#### OneDrive / Microsoft 365
- Salva e restaura via Microsoft Graph API
- Requer configurar o **Azure App Client ID**

### Detalhes técnicos
- Formato do backup: objeto JSON com `_version`, `_exported` e uma chave por entidade (`edu_alunos`, `edu_turmas`, etc.)
- A restauração sobrescreve apenas as chaves presentes no arquivo, preservando configurações não incluídas

---

## 17. Gráfico de Evolução de Notas

**Arquivo:** `js/pages/boletim.js`

### O que faz
No Boletim do Aluno, após a tabela de notas, exibe um **gráfico de linhas SVG** mostrando a evolução das notas de cada disciplina ao longo dos 4 bimestres.

### Leitura do gráfico
- **Eixo X**: 1ºBim → 2ºBim → 3ºBim → 4ºBim
- **Eixo Y**: notas de 0 a 10
- **Linha tracejada horizontal** na nota 7 (mínimo para aprovação)
- Cada disciplina é representada por uma **linha de cor diferente** com marcadores circulares nos pontos de nota
- Passe o mouse sobre um marcador para ver o valor exato no tooltip
- A legenda identifica cada linha por cor e nome da disciplina

### Condições de exibição
- O gráfico só aparece se o aluno tiver **ao menos uma nota lançada**
- Exibe no máximo 8 disciplinas para não sobrecarregar o visual
- Bimestres sem nota aparecem como interrupção na linha

---

## 18. Lista de Chamada Imprimível

**Arquivo:** `js/pages/presenca.js`

### O que faz
Gera um documento imprimível com a **lista de chamada da turma**, exibindo todos os alunos em linhas e as datas de aulas registradas em colunas.

### Como usar
1. Acesse **Presença**
2. Selecione a turma e clique em **Carregar**
3. No cabeçalho do card, clique em **📄 Lista de Chamada**
4. Uma nova janela abre com o documento e o diálogo de impressão é acionado automaticamente

### Conteúdo do documento
- Cabeçalho: nome da turma, data de geração, total de alunos e datas
- Tabela com os **últimos 20 dias** com registros para a turma
- Células pré-preenchidas: **P** (verde) = Presente, **F** (vermelho) = Falta
- Células vazias = dia sem registro para aquele aluno
- Última coluna: **Freq.** — percentual de presenças sobre aulas registradas, colorida (verde ≥75%, vermelho <75%)
- Legenda explicativa ao final

---

## 19. Tabelas Responsivas Mobile

**Arquivo:** `js/components/data-table.js`

### O que faz
Em telas com largura **menor que 640px** (smartphones), as tabelas de dados mudam automaticamente de layout tabular para **cards verticais**, onde:
- Cada linha vira um card separado com bordas e espaçamento
- Cada campo é exibido em linha própria com o nome da coluna como rótulo à esquerda e o valor à direita
- O cabeçalho da tabela (com os nomes das colunas) é ocultado
- Colunas de ações ficam à direita do card

### Comportamento
- A mudança acontece automaticamente via CSS `@media (max-width: 640px)`
- Não requer nenhuma configuração — todas as tabelas `<data-table>` do sistema herdam o comportamento
- O rótulo de cada campo usa o `data-label` gerado automaticamente a partir do nome da coluna definido em `col.label`

---

## Arquitetura Técnica Resumida

| Camada | Tecnologia | Detalhes |
|--------|-----------|---------|
| Framework | Vanilla JS (ES Modules) | Sem dependências externas de UI |
| Componentes UI | Web Components (Shadow DOM) | `<app-sidebar>`, `<app-header>`, `<app-toast>`, `<app-modal>`, `<data-table>`, `<app-search>` |
| Roteamento | History API (SPA) | `js/router.js` com lazy-loading por rota |
| Persistência | localStorage | `createStore()` em `js/store.js` |
| Session | sessionStorage | Sessão de usuário + seleções cross-page |
| PWA | Service Worker | `sw.js` para cache e instalação |
| Estilos | CSS Variables + BEM | Tema claro e escuro via `data-theme` |

---

*Manual gerado automaticamente — EduPresença v2*
