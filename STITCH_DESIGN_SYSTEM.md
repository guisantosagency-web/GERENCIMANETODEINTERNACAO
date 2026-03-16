# 🛠️ Design System do Stitch - HTO Ambulatório Digital

Este documento detalha os princípios de design e as "skills" que regem a interface deste projeto, garantindo consistência, profissionalismo e uma experiência premium.

## 1. Visão de Raio-X de Grid (Estrutura Inabalável)
O layout é construído sobre uma estrutura matemática rigorosa.
- **Grid System**: Utilização de grids de 12 colunas para layouts complexos.
- **Baseline Grid**: Espaçamento vertical consistente (padrão de 4px/8px) para garantir ritmo visual.
- **Alinhamento**: Cada elemento deve estar alinhado matematicamente, eliminando a sensação de "desordem".

## 2. DNA de Design System (Consistência Genética)
"Ninguém é deixado para trás."
- **Componentização**: Botões, inputs e cards seguem estados padronizados.
- **Raio de Borda (Corner Radius)**: Uso consistente de bordas arredondadas (ex: 2rem/3rem para seções principais, 1.5rem para cards internos).
- **Sombras (Shadows)**: Utilização de `shadow-premium` e `shadow-indicator` para criar profundidade sem poluir.

## 3. Instinto de Hierarquia Visual (Foco no que Importa)
Direcionamento do olhar através do contraste.
- **Espaço Negativo (White Space)**: Uso generoso de margens para evitar sobrecarga cognitiva.
- **Peso Tipográfico**: Títulos em `font-black` com `tracking-tight` para autoridade; informações secundárias em tons neutros.
- **CTAs em Destaque**: Botões principais com cores vibrantes (`emerald-500`) e sombras de destaque.

## 4. Adaptação Multiforma (Responsividade Extrema)
O layout se reorganiza de forma inteligente:
- **Mobile-First/Responsive-First**: Uso extensivo de Flexbox e CSS Grid.
- **Breakpoints**: Adaptação clara entre mobile, tablet e desktop, mantendo a usabilidade sem apenas "encolher" elementos.

## 🎨 O "Toque do Experimento" (Estética Profissional)

| Atributo | Descrição | Impacto |
| :--- | :--- | :--- |
| **Paleta 60-30-10** | 60% Primária (Branco/Slate-50), 30% Secundária (Emerald-500/Slate-900), 10% Destaque. | Equilíbrio visual. |
| **Microinterações** | Animações sutis (hover, active, transition-all). | Produto "vivo" e polido. |
| **Tipografia** | Escalas modulares para leitura confortável. | Legibilidade perfeita. |

---
> "Um layout consistente é um layout que o usuário não precisa aprender a usar; ele simplesmente entende." — *Nota de Segurança do Jumba*
