# Processos — Agência Mult

Site interno de processos da agência, publicado com GitHub Pages (gratuito, sem hospedagem paga). Três áreas: **RH**, **Operacional** e **Documentos extras** — feito para padronizar o trabalho de todos os coordenadores e evitar que alguma etapa fique de fora.

## Como colocar no ar

1. Neste repositório, apague os arquivos antigos e suba o conteúdo desta pasta (`index.html`, `rh.html`, `operacional.html`, `documentos-extras.html`, `assets/`, `modelos/`, `.nojekyll`) direto na raiz do repositório (branch principal).
2. Vá em **Settings → Pages**.
3. Em "Build and deployment", escolha **Deploy from a branch**, selecione a branch principal e a pasta **/ (root)**.
4. Salve. Em alguns minutos o GitHub mostra o link do site (algo como `usuario.github.io/nome-do-repositorio`).
5. Guarde esse link — é o endereço que todos os coordenadores vão acessar.

## Estrutura

- `index.html` — página inicial, com o menu para as 3 áreas
- `rh.html` — passo a passo de RH (briefing → divulgação → recrutamento → documentos/ASO → admissão → planilhas → onboarding → grupos/Trade Pro → cartas → Mob2Con/sistema da rede)
- `operacional.html` — rotina diária e mensal de controle
- `documentos-extras.html` — modelos, sistemas usados (sem senha) e glossário
- `modelos/rh/` e `modelos/operacional/` — arquivos .docx/.xlsx editáveis citados nas páginas acima
- `assets/style.css` — estilo único, compartilhado por todas as páginas

## Importante sobre segurança

Este site fica público na internet para qualquer pessoa com o link (mesmo que o repositório seja privado, isso é uma limitação do GitHub Pages fora do plano Enterprise). Por isso **não coloque senhas, dados bancários ou informação sensível de colaboradores/clientes aqui** — só nome de sistemas e processos.

## Editar conteúdo

Qualquer página é um arquivo `.html` comum — dá pra editar direto pelo navegador do GitHub (ícone de lápis, "Edit this file"), sem precisar saber programar. Os modelos em `modelos/` são arquivos do Word/Excel normais — baixe, preencha e use.

---
Página criada em 07/09/2026, substituindo a estrutura anterior por etapas (Contratação/Onboarding/Gestão). Ver também o [Painel de Automação](https://claude.ai/code/artifact/e1c943a1-46e1-4c1c-9ff3-556bf6c32e34) para o quadro geral de todas as frentes.
