# Painel SupraSoy × Guanabara

Dashboard interativo consolidando a ação de degustação SupraSoy nas lojas Guanabara Barra e Recreio: vendas reais (estoque), abordagens e previsão de vendas (formulário das promotoras), cobertura diária e comparativos semana a semana / mês a mês.

Site estático puro — **sem servidor, sem build**. Só HTML + CSS + JS + um arquivo de dados. Feito para ficar no GitHub Pages, no mesmo espírito do dashboard financeiro que vocês já mantêm.

## Estrutura dos arquivos

```
├── index.html      → estrutura da página (não precisa mexer no dia a dia)
├── style.css        → visual (não precisa mexer no dia a dia)
├── app.js            → lógica dos filtros e gráficos (não precisa mexer no dia a dia)
├── data.json        → TODOS os números do painel — é aqui que você atualiza toda semana
└── assets/
    ├── logo-suprasoy.jpg
    └── logo-mult.png
```

**No dia a dia, o único arquivo que você edita é o `data.json`.**

## Como publicar pela primeira vez (GitHub Pages)

1. Crie um repositório novo no GitHub (público), por exemplo `suprasoy-dashboard`.
2. Suba estes 5 itens (`index.html`, `style.css`, `app.js`, `data.json`, pasta `assets/`) para a raiz do repositório — pode arrastar e soltar direto na página do GitHub ("Add file → Upload files").
3. Vá em **Settings → Pages**. Em "Source", selecione a branch `main` e a pasta `/root`. Salve.
4. Em alguns minutos o GitHub mostra o link do site, algo como:
   `https://SEU-USUARIO.github.io/suprasoy-dashboard/`
5. Esse link é fixo — pode mandar pro cliente e ele sempre vai ver a versão mais atual.

## Como atualizar toda semana

Mesmo fluxo que vocês já usam no dashboard financeiro (editor web do GitHub):

1. No repositório, abra o arquivo `data.json`.
2. Clique no ícone de lápis (editar).
3. Adicione a nova semana dentro da lista `"weeks_real"` (copie o formato de uma semana existente):

```json
{
  "id": "W6",
  "start": "2026-08-18",
  "end": "2026-08-24",
  "label": "18 a 24/08",
  "barra": { "original": 0, "nature": 0, "sache": 0, "total": 0 },
  "recreio": { "original": 0, "nature": 0, "sache": 0, "total": 0 }
}
```

4. Adicione os dias correspondentes em `"daily_coverage"` (com/sem abordagem, motivo se houver) e em `"daily_form"` (se novas respostas do formulário chegarem — abordagens, previsão total, previsão sachê, previsão latas).
5. Atualize `"meta.generated"` para a data de hoje.
6. Role até o fim da página e clique em **"Commit changes"**.

Pronto — o site atualiza sozinho, sem precisar mexer em mais nada. Os filtros, gráficos, KPIs e a tabela recalculam tudo automaticamente a partir do que estiver no `data.json`.

## O que cada bloco de dado alimenta

| Campo em `data.json` | Onde aparece no site |
|---|---|
| `weeks_real` | Vendas reais, gráfico de evolução semanal, mix de SKU, tabela detalhada |
| `daily_coverage` | Calendário de cobertura (com/sem abordagem), venda diária real |
| `daily_form` | Abordagens registradas, previsão das promotoras, gráfico Previsão × Real, gap previsão→real |
| `meta.barra_pause` | Marca o intervalo pausado no calendário de cobertura (hachurado) |
| `meta.notes` | Lista de notas metodológicas no rodapé da página |

## Decisões de metodologia já aplicadas (para lembrete futuro)

- **Vendas reais** = estoque inicial − estoque final da semana, por SKU, com detecção de reposição no meio da semana (quando o estoque *sobe* entre duas contagens, isso é tratado como reabastecimento, não como venda negativa).
- **Abordagens "Bastante"** (respostas de texto no formulário, sem número) foram convertidas para uma estimativa de ~50, sinalizadas como estimadas — combinado com o cliente em 20/08/2026.
- **Guanabara Barra ficou sem ação ativa entre 01/08 e 17/08/2026** (retomada em 18/08) — esse período aparece hachurado no calendário, não como "dado faltando".
- **Gap previsão → real** é calculado *dia a dia*, só nos dias em que existe tanto a previsão do formulário quanto a venda real diária (via `daily_coverage`). Comparar a previsão de uma semana parcialmente respondida contra a venda real da semana inteira dá um resultado enganoso — por isso não fazemos isso em nenhum lugar do painel.
- Datas do formulário com erro óbvio de digitação (ano errado, formato trocado) foram corrigidas na base de dados a partir do carimbo de data/hora do envio.

## Rodando localmente antes de publicar (opcional)

Se quiser conferir como ficou antes de subir pro GitHub:

```bash
cd pasta-do-dashboard
python3 -m http.server 8000
```

Depois abra `http://localhost:8000` no navegador.
