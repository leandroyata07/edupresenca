# Manual de Atualizações EduPresença (Sessão Atual)

Este manual documenta todas as melhorias visuais, de usabilidade e arquiteturais implementadas na sessão de hoje. O objetivo das mudanças foi tornar o **Módulo de Relatórios** mais inteligente e preparar a base de dados para atuar como uma **Secretaria Escolar Oficial**, suportando históricos consolidados em modelo de Módulos (Semestres).

---

## 1. Censo Demográfico Detalhado
O relatório do "Censo Demográfico" passou por uma reestruturação para fornecer métricas mais profundas sobre o perfil dos alunos.

**Como funciona agora:**
- Além de contar o número total de alunos por Cor/Raça (ex: Pretos, Pardos, Brancos), o sistema cruza esses dados com o **Sexo**.
- **Exemplo de Exibição:** Em vez de apenas exibir "15 Negros", o cartão exibirá de forma estruturada: `15 alunos negros (8 feminino, 7 masculino)`.
- **Exportação:** O CSV gerado ao exportar também refletirá essas quebras, ideal para envios ao Censo Escolar ou SEC.

---

## 2. Presença por Período de Datas (De/Até)
O antigo relatório de "Presença por Data" filtrava apenas um único dia específico, e sofria de um problema de usabilidade onde o campo "perdia o foco" enquanto o usuário digitava o ano.

**O que foi feito:**
- **Filtro de Período:** O campo único foi substituído por dois campos: **Data Início** e **Data Fim**.
- **Sem Limites:** Você pode pesquisar o período que desejar (ex: `01/01/2026 a 30/06/2026`), listando todas as presenças/faltas do intervalo de uma vez.
- **Correção de Digitação:** A interface foi reescrita (DOM assíncrono condicional) para garantir que você possa digitar o ano letivo completo sem interrupções.
- **Visualização:** A coluna "Data" foi injetada no relatório para que fique claro a qual dia aquele registro pertence.

---

## 3. Filtros em Cascata nos Relatórios
Encontrar o boletim de um aluno ou notas de uma disciplina em uma base com centenas de registros estava trabalhoso.

**Como funciona agora:**
Foi introduzida uma hierarquia de filtros nos relatórios **Desempenho por Aluno** e **Notas por Disciplina**:
1. Você seleciona a **Unidade**.
2. O sistema filtra e mostra apenas os **Cursos** daquela Unidade.
3. Você seleciona o **Turno**.
4. O sistema exibe apenas as **Turmas** daquela combinação.
5. Por fim, a lista suspensa de alunos ou a tabela de notas é filtrada cirurgicamente.

---

## 4. Histórico Escolar Oficial (Modelo Bahia)
Substituímos o modelo simples de "Boletim Consolidado" pela prancha oficial do **Histórico Escolar da Educação Profissional Técnica de Nível Médio** (usado pelo Governo do Estado da Bahia).

**O que ele exibe:**
- Cabeçalhos governamentais oficiais.
- Dados institucionais integrados (Nome, Código e Endereço do Estabelecimento).
- Dados do aluno centralizados (Nome, Nascimento, Matrícula, Nacionalidade, Curso).
- Uma matriz de **COMPONENTES CURRICULARES**, cruzando automaticamente as Disciplinas com os semestres (Módulo I, II, III e IV).
- Assinatura digital automática baseada nos cálculos de presença e faltas do aluno.

---

## 5. Nova Arquitetura de Módulos (O "Carimbo" de Notas)
Para que o Histórico Oficial acima funcionasse sem misturar notas de "Bimestres" com notas de "Módulos/Semestres", aplicamos uma solução arquitetural invisível que não quebra nenhum dado existente.

**O Desafio:** No Estado da Bahia, `Módulo = Semestre` e `Unidade = Bimestre`. O sistema precisava saber como separar isso sem forçar o professor a aprender fluxos novos.

**A Solução de Hoje:**
1. **Turmas com Módulo:** Na tela de criar ou editar `Turmas`, há um novo campo chamado **"Módulo Atual (Semestre)"**.
2. **Carimbo Silencioso:** Quando o professor preenche o Diário de Notas e clica em Salvar, o EduPresença olha sorrateiramente para a turma atual do aluno. Se a turma é do Módulo 2, o sistema pega a nota (ex: 8.0) e carimba nela: *"Esta nota foi tirada no Módulo 2"*.
3. **Leitura Inteligente:** O Histórico Oficial agora não depende mais do texto que o professor escreveu em "Referência". Ele puxa a nota pelo "Carimbo Oficial" do módulo e a insere diretamente na coluna certa.
4. **Retrocompatibilidade:** Se o aluno tem notas antigas (sem o carimbo), o sistema usa uma "heurística de adivinhação" pelo texto digitado pelo professor. Nada se perde.

**Como usar na prática:**
Para turmas novas, ao cadastrá-las, apenas defina qual é o Módulo (ex: Turma Tec-ADM ingressante = Módulo 1). Para as antigas, você pode editar e colocar o módulo correto quando quiser. O sistema fará todo o resto sozinho.
