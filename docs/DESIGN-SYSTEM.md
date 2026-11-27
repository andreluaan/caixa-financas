# Design system: sumi + vidro (andreluaan.dev)

Guia para levar a identidade do Caixa para outros apps, sites, Figma, Flutter ou SwiftUI. Tudo aqui foi extraído do
código que está no ar (`src/styles.css`, `src/components/ui.tsx`, `src/lib/appearance.ts`). A marca em si (símbolo AL,
hanko, selo, manual) tem fonte própria: `C:\PROJETOS DE PROGRAMAÇÃO\Andreluaan.dev\DOCUMENTACAO-TECNICA.md`. Este
arquivo resume a marca e detalha a interface.

**Em uma frase:** tinta sumi sobre papel, vidro fosco por cima, um único fio vermelho shu, e movimento que parece pincel
(entra rápido e assenta devagar).

---

## 1. Princípios

1. **Sumi primeiro.** O fundo é tinta (escuro) ou papel (claro). Cor saturada é exceção.
2. **Shu é raro.** O vermelho aparece só no fio, no ponto, no foco e em alertas. Se tiver shu em mais de ~2% da tela, há
   shu demais.
3. **Vidro sobre tinta.** Cartões são vidro fosco sobre um fundo vivo (manchas de tinta que derivam devagar). Sem fundo
   vivo, o vidro vira cinza chapado: nunca use vidro sobre cor lisa.
4. **O ponto é o único círculo cheio.** Pontos finais, indicador de aba ativa e o "•" de status são redondos (regra do
   ponto redondo, §3).
5. **Movimento de pincel.** Entradas com ease-out forte, toques com mola leve, nada linear. Tudo respeita
   `prefers-reduced-motion`.
6. **Polegar primeiro no celular.** A ação principal fica embaixo, alvos de toque ≥ 44 px, no máximo 5 abas.

---

## 2. Cores

### 2.1 Marca (impressão e peças estáticas)

| Papel | Hex | RGB | Uso | Proporção |
|---|---|---|---|---|
| Papel | `#F3F0E8` | 243 240 232 | Fundo principal | 70% |
| Sumi | `#151515` | 21 21 21 | Símbolo, títulos, texto | 22% |
| Cinza | `#7A766E` | 122 118 110 | Apoio, circuito, linhas | 6% |
| Shu | `#B5392C` | 181 57 44 | Só o fio, o ponto e o selo | 2% |

### 2.2 Interface: tokens por tema

O app troca de tema mudando `data-theme` no `<html>`. Os nomes são os mesmos nos dois temas: **ink** é sempre a cor do
texto e **sumi** sempre a do fundo.

| Token | Escuro | Claro | Para quê |
|---|---|---|---|
| `--sumi` | `#151515` | `#ECE8DF` | Fundo da página |
| `--ink` | `#ECE8DF` | `#151515` | Texto principal, botão primário |
| `--ink-strong` | `#FFFFFF` | `#000000` | Hover do primário |
| `--on-ink` | `#151515` | `#ECE8DF` | Texto sobre o botão primário |
| `--ink-2` | `#C9C4BA` | `#47433D` | Texto de apoio |
| `--gray` | `#8E8A82` | `#6F6B64` | Legendas mono, ícones inativos, placeholders |
| `--line` | `#34322F` | `#CBC5B9` | Divisórias fortes |
| `--line-2` | `#2A2826` | `#D9D3C8` | Divisórias leves, trilhos de progresso |
| `--shu` | `#C8503E` | `#B9432F` | Fio, ponto, foco, alerta |
| `--tint` | `236, 232, 223` | `255, 255, 255` | Triplo RGB usado em `rgba(var(--tint), α)` para brilhos e superfícies |
| `--field` | `rgba(0,0,0,.28)` | `rgba(255,255,255,.55)` | Fundo de campo de texto |
| `--c-in` | `#5D8ECE` (azul ai) | `#3464A0` | Gráfico: entradas |
| `--c-out` | `#C8503E` | `#B9432F` | Gráfico: saídas |

Estados de superfície (derivados de `--tint`):

| Token | Valor | Uso |
|---|---|---|
| `--hover` | `rgba(tint, .07)` | Fundo ao passar o mouse |
| `--active` | `rgba(tint, .12)` | Item selecionado |
| Pílula | `rgba(tint, .06)` + borda `rgba(tint, .14)` | Botões secundários |

### 2.3 Regras de uso

- **Texto nunca usa a cor da série do gráfico.** Valores ficam em ink ou ink-2; só o valor de destaque (Entrou/Saiu)
  pode usar `--c-in`/`--c-out`.
- **Par do gráfico validado para daltonismo:** azul ai × shu passa nos testes de deuteranopia e protanopia nos dois
  temas. Se precisar de uma terceira série, use cinza (`--gray`), não outra cor.
- **Foco:** contorno de 2 px em `--shu`, afastado 2 px. Em campos de texto: borda shu e um halo
  `0 0 0 4px rgba(200, 80, 62, .14)`.
- **Contraste (medido):** ink sobre sumi 14,9:1 e ink-2 8:1 a 10,5:1 (AAA nos dois temas); `--gray` 5,3:1 no escuro e 4,3:1 no
  claro, então use só em legendas e rótulos; shu fica entre 4,1:1 e 4,4:1, bom para fios, pontos e ícones, não para texto corrido.

### 2.4 Fundo vivo ("tinta")

Quatro manchas radiais grandes que derivam devagar por trás de tudo, com uma camada de granulado por cima.

| Mancha | Tamanho | Posição | Cor escuro | Cor claro | Ciclo |
|---|---|---|---|---|---|
| b1 | 52 × 46 vmax | topo-esquerda, saindo da tela | `rgba(214,209,199,.5)` | `rgba(122,118,110,.38)` | 38 s |
| b2 | 60 × 52 vmax | base-direita, saindo da tela | `rgba(140,135,126,.65)` | `rgba(169,164,155,.55)` | 46 s |
| b3 | 22 vmax | alto, à direita | `rgba(200,80,62,.36)` (shu) | `rgba(200,80,62,.26)` | 30 s |
| b4 | 34 × 30 vmax | base, ao centro | `rgba(236,232,223,.3)` | `rgba(21,21,21,.16)` | 52 s |

- Cada mancha é um `radial-gradient(closest-side, …)` com cinco paradas (100% → 62% → 28% → 8% → 0), **sem
  `filter: blur`** (mais leve e sem serrilhado).
- **Deriva:** `translate(0,0) scale(1) rotate(0)` → `translate(6vw,4vh) scale(1.12) rotate(18deg)` →
  `translate(-4vw,8vh) scale(.94) rotate(-12deg)`, ease-in-out, alternando, com atrasos negativos diferentes para nunca
  sincronizar.
- **Granulado:** ruído SVG (`feTurbulence fractalNoise, baseFrequency .85, 3 oitavas`) em ladrilho de 160 px, opacidade
  5% no escuro e 4% no claro, sem modo de mesclagem.
- **Variante "memória":** dois brilhos radiais estáticos e a marca de memória gigante, cortada pela borda direita.

---

## 3. Tipografia

| Papel | Fonte | Peso | Tamanho (web) | Espaçamento |
|---|---|---|---|---|
| Título de destaque | Geist | Light 300 | 32–46 px (`clamp(32px, 4vw, 46px)`), altura 1,06 | −3% |
| Valor grande (saldo) | Geist | Regular 400 | 30–36 px, números tabulares | −2% a −3% |
| Título de seção | Geist | Medium 500 | 17–18 px | −1% |
| Título de painel (sheet) | Geist | Regular 400 | 19 px | −2% |
| Corpo | Geist | Regular 400 | 14–15 px, altura 1,5 | 0 |
| Apoio | Geist | Regular 400 | 12–13 px, cor ink-2 | 0 |
| Legenda / rótulo | Geist Mono | 400–500, **caixa alta** | 10–11 px, cor gray | +10% |
| Aba do menu | Geist | 400 | 10 px | +1% |

- **Fontes gratuitas** (Google Fonts, SIL OFL): Geist, Geist Mono, Zen Maru Gothic.
- **Números sempre tabulares** (`font-variant-numeric: tabular-nums`) para colunas de valores alinharem.
- **Campos no celular com 16 px:** abaixo disso o iOS dá zoom ao tocar.
- **Katakana** (アンドレ・ルアン) usa Shippori Mincho ou Zen Kaku, porque a Geist não tem japonês.

### Regra do ponto redondo

A Geist desenha o ponto quadrado; na marca, **todo "." é o ponto redondo da Zen Maru Gothic**. Na web, carregue a Zen
Maru só com o caractere ponto e coloque-a antes da Geist:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@300;400;500;700&text=.&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap">
```

```css
:root {
  --font: 'Zen Maru Gothic', 'Geist', system-ui, sans-serif;  /* the subset only holds "." */
  --mono: 'Zen Maru Gothic', 'Geist Mono', ui-monospace, monospace;
}
```

Em apps nativos ou no Figma, troque o glifo "." manualmente pelo da Zen Maru no peso equivalente
(Light → Light, Regular → Regular, Medium → Medium, SemiBold → Bold).

**Assinatura de título:** título + ponto final em shu + um traço shu de 28 × 2 px embaixo (`.cut`). Usar só no título
principal de cada tela, nunca em todos.

---

## 4. Forma, espaço e profundidade

### 4.1 Raios

| Elemento | Raio |
|---|---|
| Painel de vidro | 22 px |
| Cartão interno (`glass-2`), KPI | 16 px |
| Campo de texto | 14 px |
| Item de menu lateral, pílula do menu | 12 px |
| Botões, pílulas, abas, segmentados | 999 px (cápsula) |
| Sheet do celular | 26 px em cima, 0 embaixo |
| Avatar, ponto, botão flutuante | 50% |

### 4.2 Espaçamento

Escala em múltiplos de 2 com base 4: **4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22**.

| Onde | Computador | Celular (≤ 720 px) |
|---|---|---|
| Margem da página | 20 px | 10 px + área segura do iOS |
| Entre cartões | 16 px | 12 px |
| Dentro do painel | 20 × 22 px | 16 px |
| Dentro do cartão interno | 14 × 16 px | 14 px |
| Entre campos de formulário | 14 px | 14 px |

### 4.3 Alturas mínimas (alvo de toque)

| Elemento | Altura |
|---|---|
| Botão primário, campo, botão de ícone (celular) | 44 px |
| Pílula secundária | 36 px |
| Aba do menu inferior | 54 px |
| Botão flutuante "+" | 66 px (mesma altura da barra de abas) |

### 4.4 Vidro

Duas camadas. Use a primeira para painéis e a segunda para cartões dentro deles. Nunca vidro dentro de vidro.

**Vidro (painel)**

```css
.glass {
  position: relative;
  isolation: isolate;
  border-radius: 22px;
  background: linear-gradient(150deg, var(--glass-a), var(--glass-b) 60%);
  backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid var(--glass-border);
  box-shadow:
    inset 0 1px 0 rgba(var(--tint), .22),   /* light on the top edge */
    inset 0 -1px 0 rgba(0, 0, 0, .12),       /* shade on the bottom edge */
    var(--glass-shadow);
}
/* gradient rim: bright at top-left, fades, glints again at bottom-right */
.glass::before {
  content: ''; position: absolute; inset: -1px; z-index: -1;
  border-radius: inherit; padding: 1px; pointer-events: none;
  background: linear-gradient(135deg, var(--glass-edge), transparent 28%, transparent 70%, rgba(var(--tint), .3));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
}
```

| Token | Escuro | Claro |
|---|---|---|
| `--glass-a` (topo) | `rgba(236,232,223,.11)` | `rgba(255,255,255,.62)` |
| `--glass-b` (base) | `rgba(236,232,223,.025)` | `rgba(255,255,255,.28)` |
| `--glass-border` | `rgba(236,232,223,.12)` | `rgba(255,255,255,.7)` |
| `--glass-edge` (brilho da borda) | `rgba(236,232,223,.55)` | `rgba(255,255,255,.95)` |
| `--glass-shadow` | `0 30px 80px rgba(0,0,0,.5), 0 2px 6px rgba(0,0,0,.25)` | `0 30px 70px rgba(70,58,44,.16), 0 2px 6px rgba(70,58,44,.08)` |

**Cartão interno (`glass-2`):** fundo `rgba(tint, .05)`, borda `rgba(tint, .10)`, raio 16 px, sem desfoque.

**Luz que segue o mouse** (só em aparelhos com mouse): um brilho radial de 420 px sob o cursor,
`rgba(tint, .09)` no escuro e `rgba(255,255,255,.55)` no claro, até 45% do raio. Ele aparece em 0,4 s ao passar o mouse.

**Acessibilidade:** com `prefers-reduced-transparency`, troque o vidro por `--sumi` sólido e pare as manchas.

### 4.5 Lente líquida (menu)

O item ativo do menu tem uma pílula de vidro que desliza entre as abas. Enquanto o dedo está pressionado, ela vira uma
**lente** que se arrasta junto:

- **Pílula:** gradiente `rgba(tint,.16) → rgba(tint,.06)`, borda `rgba(tint,.16)`, brilho interno no topo e um fio shu de
  2 px à esquerda (no menu lateral).
- **Lente:** fundo quase transparente (`rgba(tint,.04)`), borda branca 50%, brilhos internos, sombra
  `0 14px 32px rgba(0,0,0,.32)`, `backdrop-filter: blur(.6px) saturate(190%) brightness(1.18) contrast(1.06)`, um aro
  iridescente fino (conic-gradient) com 60% de opacidade e dois reflexos radiais brancos.
- **Física:**
  - a lente estica na direção do arrasto conforme a velocidade: `stretch = 1 + min(v × 0.22, 0.32)`, suavizado a 35%
    por quadro;
  - ela afina na outra direção, com `squash = 1 / √stretch`;
  - o item sob a lente cresce 16%, e a barra inteira cresce 3,5%;
  - ao soltar, a lente encaixa no item mais próximo com mola.

---

## 5. Movimento

### 5.1 Curvas e durações

| Nome | Curva | Quando |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entradas, revelações, trilhos de progresso |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Toques, ícones, pop, coisas que "assentam" |
| Deslize de menu | `cubic-bezier(0.32, 0.72, 0, 1)` | Pílula indo de uma aba a outra (560 ms) |
| Troca de tema | `cubic-bezier(0.7, 0, 0.2, 1)` | Revelação circular (700 ms) |
| Marca (loader) | `cubic-bezier(0.2, 0.7, 0.2, 1)` | Animação da marca de memória |

| Faixa | Duração | Exemplos |
|---|---|---|
| Micro | 250–300 ms | Cor, borda, hover |
| Toque | 300–450 ms | Pressionar (escala .94), pop de ícone |
| Entrada | 500–900 ms | Cartões subindo, lista deslizando, sheet |
| Cena | 1–1,4 s | Título, fundo aparecendo |
| Ambiente | 30–52 s | Deriva das manchas |

**Escalonamento:** cartões entram 70 ms um depois do outro; linhas de lista, 50 ms; barras de gráfico, 80 ms; passos de
um guia, 60 ms.

### 5.2 Catálogo de animações

| Nome | O que faz | Duração · curva | Detalhe |
|---|---|---|---|
| `rise` | Cartão sobe e aparece | 900 ms · ease-out | `translateY(26px) scale(.975)` → normal, + 70 ms por cartão |
| `reveal` | Título revelado de baixo para cima | 1,1 s · ease-out · atraso 150 ms | `clip-path: inset(0 0 100% 0)` → `inset(0 0 -10% 0)` + sobe 18 px |
| `drop` | Ponto final shu cai no lugar | 700 ms · spring · atraso 900 ms | cai 14 px vindo de `scale(.4)` |
| `grow-x` | Traço shu sob o título cresce | 900 ms · ease-out · atraso 500 ms | `scaleX(0)` → 1, origem à esquerda |
| `grow-y` | Barras do gráfico crescem | 1 s · ease-out | `scaleY(0)` → 1, origem embaixo, + 80 ms por barra |
| `fill` | Trilho de progresso enche | 1–1,2 s · ease-out | `width: 0` → valor |
| `slide-in` | Linha de lista entra da esquerda | 600 ms · ease-out | `translateX(-12px)` + opacidade, 200 ms + 50 ms por linha |
| `pop` | Ícone da aba ativa salta | 550 ms · spring | 0.8 → 1.18 (sobe 1 px) → 1 |
| `spin-in` | Marca do topo gira ao entrar | 1,2 s · ease-out | `rotate(-90deg) scale(.6)` → normal |
| `draw` | Traços finos se desenham | 4 s · ease-out | `stroke-dashoffset` de 2400 a 0 |
| `drift` | Manchas do fundo derivam | 30–52 s · ease-in-out · alterna | ver §2.4 |
| `tabbar-in` | Barra de abas sobe ao abrir | 800 ms · spring | sobe 30 px vindo de `scale(.92)` |
| `sheet-up` / `sheet-down` | Painel inferior abre e fecha | 550 ms ease-out / 250 ms ease-in | `translateY(100%)` |
| `toast-in` / `hint-in` | Aviso surge | 500–600 ms · spring | sobe 20 px vindo de `scale(.95)` |
| Count-up | Valores em R$ contam até o número | 900 ms · ease-out quártica | `1 − (1 − t)⁴`, escreve direto no texto, sem re-render |
| Troca de tema | Novo tema se espalha em círculo a partir do clique | 700 ms | View Transitions + `clip-path: circle()` do raio 0 até o canto mais distante |
| Brilho do cartão | Reflexo atravessa o cartão de crédito no hover | 900 ms · ease-out | faixa `rgba(tint,.22)` a 105°, de −120% a 120%, + inclinação 3D 4°/−6° |
| Pressionar | Qualquer botão encolhe ao toque | 300 ms · spring | `scale(.94)`; o "+" flutuante vai a `.9` |
| Hover de cartão | Cartão levanta | 450 ms · spring | `translateY(-3px)` + borda mais clara |
| Anel do guia | Destaque pulsa em volta do elemento | 1,8 s · infinito | aro shu de 1,5 px, `scale(1 → 1.12)` sumindo |

### 5.3 Marca de memória animada (loader)

Da documentação da marca: o círculo se desenha (0–400 ms), o fio shu desce (600 ms), o corte desloca a metade direita
(750 ms) e o sinal repousa (900 ms), com curva `cubic-bezier(0.2, 0.7, 0.2, 1)`. Com movimento reduzido, mostre só o quadro
final.

### 5.4 Movimento reduzido

Com `prefers-reduced-motion: reduce`: todas as animações e transições caem para ~0 ms, as manchas param, os valores
aparecem já no número final e a troca de tema não faz a revelação circular. O conteúdo nunca depende de uma animação para
aparecer.

---

## 6. Componentes

| Componente | Anatomia | Notas |
|---|---|---|
| **Botão primário** | Cápsula ink com texto on-ink, 600, 14 px, 44 px de altura, ícone de 14–15 px | Hover: ink-strong + sombra `0 8px 24px rgba(tint,.18)` + sobe 1 px |
| **Pílula** | Cápsula `rgba(tint,.06)`, borda `rgba(tint,.14)`, texto ink-2, 13 px, 36 px | Variante "adicionar": ícone "+" que gira 90° no hover |
| **Botão de ícone** | Círculo transparente de 36 px (44 px no celular), ícone gray | Hover: fundo `--hover`, ícone ink girando −12° |
| **Campo** | 44 px, raio 14, fundo `--field`, borda glass-border, rótulo mono acima | Foco: borda shu + halo shu de 4 px |
| **Segmentado** | Trilho `--field` com cápsulas; a opção ativa é ink com texto on-ink | Variante larga (divide a largura) e de duas linhas (rótulo + valor) |
| **KPI** | Cartão interno: rótulo mono, valor grande com count-up, nota em ink-2 | No celular, o saldo ocupa a largura toda e Entrou/Saiu ficam lado a lado |
| **Linha de lista** | Avatar 36 px + título 14 px + sub 12 px + valor à direita | Divisória `--line-2` em cima; o sub termina em "…" no celular |
| **Sheet** | `<dialog>` nativo; no celular vem de baixo, com alça de 40 × 4 px, raio 26 em cima | Fecha com Esc, toque fora ou ×; nunca há um cartão dentro de outro cartão |
| **Barra de abas (celular)** | Cápsula de vidro fixa embaixo, 5 abas (ícone de 20 px + rótulo de 10 px), ponto shu de 4 px sob a ativa | O "+" redondo fica ao lado, na mesma linha |
| **Guia interativo** | Tela escurecida a 62% com um recorte em volta do elemento real, aro shu pulsando e balão de fundo sumi com seta | O balão vai para cima quando o elemento está num sheet ou perto do rodapé |
| **Cartão de crédito** | Retângulo `glass-2` com nome em mono e o fio shu vertical (eco da marca) | Hover com reflexo e inclinação 3D |

### Ícones

Traço de 1,6 px, pontas e junções redondas, grade de 24 px, sem preenchimento. Tamanhos usados: 14 · 16 · 18 · 20 · 24.
Ícones inativos ficam em `--gray` e ativos em `--ink`. Shu só no ícone do item escolhido em seletores de opções.

---

## 7. Identidade AL / andreluaan.dev

| Peça | Uso | Regra |
|---|---|---|
| **AL principal** | Capas, portfólio, apresentações | AL a pincel, A e L divididos por um corte de espada, com circuito cinza, katakana アンドレ・ルアン, hanko e wordmark |
| **AL compacta** | Perfis, assinaturas | O mesmo AL, sem o circuito |
| **Marca de memória** | Topo de apps, 16 px, loaders, marca d'água | Círculo sumi cortado por um fio shu vertical; a metade direita é deslocada para baixo, como o L |
| **Hanko** | Autoria: rodapés, documentos | Quadrado shu com "AL" desenhado (não é fonte) |
| **Selo** | Carimbo, adesivo, lacre | Círculo da memória em shu, com o AL dentro |
| **Wordmark** | Quando o símbolo já está presente | `andreluaan.dev` em Geist Light, espaçamento de 40–60%, ponto redondo, cursor shu embaixo |
| **Favicon** | Aba do navegador | Marca de memória em 16 px; AL reduzido a partir de 32 px |

### Marca de memória: construção

- **D** = diâmetro externo do círculo;
- **traço:** 0,08 D;
- **vão do corte:** 0,07 D;
- **deslocamento da metade direita:** 0,05 D;
- **fio shu:** passa 0,18 D além do círculo, em cima e embaixo;
- **respiro em volta:** 0,25 D;
- **versões:** vazada (oficial), negativa, mono e selo.

Versão usada no app (34 × 40), pronta para copiar:

```svg
<svg width="34" height="40" viewBox="0 0 34 40" role="img" aria-label="andreluaan.dev">
  <g fill="none" stroke="#ECE8DF" stroke-width="2.6">
    <path d="M16.2 6.4 A12.4 12.4 0 0 0 16.2 31.2" />
    <path d="M17.8 8 A12.4 12.4 0 0 1 17.8 32.8" />
  </g>
  <line x1="17" y1="1" x2="17" y2="39" stroke="#C8503E" stroke-width="1.3" />
</svg>
```

No claro, troque o traço para `#151515` e o fio para `#B9432F`.

### Arquivos da marca

Em `C:\PROJETOS DE PROGRAMAÇÃO\Andreluaan.dev`:

| Arquivo | Conteúdo |
|---|---|
| `andreluaan-logo-oficial.svg` | Logo oficial |
| `andreluaan-simbolo.svg` | Símbolo AL |
| `andreluaan-hanko.svg` | Hanko |
| `andreluaan-favicon-reduzido.svg` | Favicon reduzido |
| `andreluaan-manual-da-marca-v1.5.pdf` | Manual da marca |

No Figma, as páginas "andreluaan.dev — marca" e "andreluaan.dev — manual".

### Faça e não faça

- **Faça:** fundo sumi ou papel; um fio ou ponto shu por composição; muito respiro; rótulos em mono caixa alta.
- **Não faça:** shu em blocos grandes, gradientes coloridos, neon, sombras coloridas, a marca de memória preenchida,
  ponto quadrado, vidro sobre fundo liso, mais de um destaque shu competindo na mesma tela.

---

## 8. Levando para outras plataformas

### 8.1 CSS (web, qualquer framework)

Copie o bloco de tokens do começo de `src/styles.css` (linhas 1–63: os dois temas, as fontes e os estados) e as classes `.glass`, `.glass-2`,
`.mono`, `.num`. Troque o tema com `document.documentElement.dataset.theme = 'light' | 'dark'`.

### 8.2 Tokens em JSON (Figma Tokens Studio, Style Dictionary)

```json
{
  "color": {
    "sumi":    { "dark": "#151515", "light": "#ECE8DF" },
    "ink":     { "dark": "#ECE8DF", "light": "#151515" },
    "ink-2":   { "dark": "#C9C4BA", "light": "#47433D" },
    "gray":    { "dark": "#8E8A82", "light": "#6F6B64" },
    "line":    { "dark": "#34322F", "light": "#CBC5B9" },
    "line-2":  { "dark": "#2A2826", "light": "#D9D3C8" },
    "shu":     { "dark": "#C8503E", "light": "#B9432F" },
    "chart-in":  { "dark": "#5D8ECE", "light": "#3464A0" },
    "chart-out": { "dark": "#C8503E", "light": "#B9432F" }
  },
  "radius": { "panel": 22, "card": 16, "field": 14, "nav": 12, "pill": 999, "sheet": 26 },
  "space":  [4, 6, 8, 10, 12, 14, 16, 18, 20, 22],
  "font": {
    "sans": "Geist", "mono": "Geist Mono", "dot": "Zen Maru Gothic", "kana": "Shippori Mincho"
  },
  "motion": {
    "ease-out":    [0.16, 1, 0.3, 1],
    "ease-spring": [0.34, 1.56, 0.64, 1],
    "ease-nav":    [0.32, 0.72, 0, 1],
    "ease-theme":  [0.7, 0, 0.2, 1],
    "ease-mark":   [0.2, 0.7, 0.2, 1],
    "duration": { "micro": 250, "press": 300, "enter": 900, "scene": 1100, "stagger": 70 }
  },
  "glass": {
    "blur": 20, "saturate": 1.6,
    "dark":  { "top": "rgba(236,232,223,0.11)", "bottom": "rgba(236,232,223,0.025)", "border": "rgba(236,232,223,0.12)" },
    "light": { "top": "rgba(255,255,255,0.62)", "bottom": "rgba(255,255,255,0.28)", "border": "rgba(255,255,255,0.7)" }
  }
}
```

### 8.3 Tailwind

```js
// tailwind.config.js
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        sumi: 'var(--sumi)', ink: 'var(--ink)', 'ink-2': 'var(--ink-2)',
        gray: 'var(--gray)', line: 'var(--line)', shu: 'var(--shu)',
      },
      fontFamily: {
        sans: ['"Zen Maru Gothic"', 'Geist', 'system-ui', 'sans-serif'],
        mono: ['"Zen Maru Gothic"', '"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { panel: '22px', card: '16px', field: '14px' },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
};
```

### 8.4 Figma

- **Variáveis:** uma coleção "Cor" com os modos Escuro e Claro (tabela §2.2), uma "Raio" e uma "Espaço".
- **Vidro:**
  - preenchimento em gradiente linear de 150° (`glass-a` → `glass-b`);
  - efeito Background blur 20;
  - traço interno de 1 px em `glass-border`;
  - sombras internas de 1 px (topo clara, base escura);
  - sombra externa grande (`glass-shadow`).
- **Fundo vivo:** quatro elipses com preenchimento radial (§2.4) e uma camada de ruído a 5%.
- **Protótipo:** Smart Animate com bezier `0.16, 1, 0.3, 1` (entradas) e Spring (toques).

### 8.5 SwiftUI (iOS)

```swift
extension Color {
    static let sumi = Color(light: .init(hex: 0xECE8DF), dark: .init(hex: 0x151515))
    static let ink  = Color(light: .init(hex: 0x151515), dark: .init(hex: 0xECE8DF))
    static let shu  = Color(light: .init(hex: 0xB9432F), dark: .init(hex: 0xC8503E))
}

struct Glass: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(.ultraThinMaterial, in: .rect(cornerRadius: 22))
            .overlay(RoundedRectangle(cornerRadius: 22).strokeBorder(.white.opacity(0.12)))
            .shadow(color: .black.opacity(0.5), radius: 40, y: 30)
    }
}

// Motion
let easeOut = Animation.timingCurve(0.16, 1, 0.3, 1, duration: 0.9)
let press   = Animation.spring(response: 0.3, dampingFraction: 0.6)
```

No iOS 26, use `.glassEffect()` no lugar do `ultraThinMaterial`: é o equivalente nativo da lente líquida.

### 8.6 Flutter

```dart
const sumi = Color(0xFF151515);
const ink = Color(0xFFECE8DF);
const shu = Color(0xFFC8503E);

const easeOut = Cubic(0.16, 1, 0.3, 1);
const spring = Cubic(0.34, 1.56, 0.64, 1);

// Glass: ClipRRect(radius 22) > BackdropFilter(ImageFilter.blur(sigmaX: 20, sigmaY: 20))
//        > Container(gradient 150deg glass-a → glass-b, border 1px glass-border)
```

---

## 9. Checklist rápido para uma tela nova

- [ ] Fundo sumi com manchas derivando; nada de cor lisa atrás do vidro.
- [ ] No máximo um título com ponto e traço shu.
- [ ] Rótulos em mono caixa alta; valores com números tabulares.
- [ ] Cartões entram com `rise` escalonado; botões encolhem ao toque.
- [ ] Shu só no fio, no ponto, no foco ou num alerta.
- [ ] Alvos ≥ 44 px no celular, campos com 16 px, ação principal embaixo.
- [ ] Testado em escuro e claro, com movimento reduzido e com transparência reduzida.
