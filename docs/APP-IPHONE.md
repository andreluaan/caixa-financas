# Caixa no iPhone

Há dois caminhos para ter o Caixa como aplicativo no iPhone. O primeiro já funciona hoje; o segundo é a próxima etapa,
se fizer sentido depois de usar o primeiro.

## 1. App instalado pela web (PWA) — pronto

O iPhone não instala arquivos executáveis baixados da internet: fora da App Store, o jeito oficial é instalar o app web
na tela de início. O Caixa já foi preparado para isso.

**Como instalar**

1. No iPhone, abra <https://caixa-financas-ten.vercel.app> **no Safari** (no iOS 16.4 ou mais novo também funciona pelo Chrome).
2. Toque em **Compartilhar** (o quadrado com a seta para cima).
3. Toque em **Adicionar à Tela de Início** → **Adicionar**.
4. Abra pelo ícone **Caixa** e entre com o seu usuário. O login fica salvo no app.

O próprio Caixa mostra essa dica quando é aberto no Safari do iPhone.

**O que já se comporta como app**

| Item | Situação |
|---|---|
| Ícone próprio na tela de início | ✓ marca sumi/shu, com respiro para o recorte do iOS |
| Abre em tela cheia, sem barra do navegador | ✓ |
| Tela de abertura (splash) | ✓ para iPhone SE até iPhone 16 Pro Max |
| Barra de status sobre o fundo, conteúdo fora do notch | ✓ |
| Campos sem zoom ao tocar | ✓ texto de 16px no celular |
| Abre sem internet (a interface) | ✓ os dados precisam de conexão |
| Atualiza sozinho a cada deploy | ✓ na próxima abertura |
| Atalhos no ícone (segurar o ícone) | Android sim; no iPhone, não existe |
| Notificações (contas vencendo) | possível no iOS 16.4+; ainda não implementado |

**Limites**

- Não aparece na App Store e não dá para mandar para outras pessoas como "arquivo".
- Notificações push exigem um servidor que dispare os avisos (ex.: função agendada no Supabase); é um projeto à parte.

## 2. App nativo (App Store / TestFlight) — próxima etapa, se quiser

O código atual pode ser empacotado como app iOS com o **Capacitor**, sem reescrever as telas: ele coloca o mesmo app
dentro de um projeto Xcode. O que isso exige:

| Requisito | Por quê | Custo |
|---|---|---|
| Conta **Apple Developer Program** | Para instalar por TestFlight ou publicar na App Store | US$ 99 por ano |
| Um **Mac com Xcode** *ou* um serviço de build na nuvem (Codemagic, Ionic Appflow) | A Apple só compila apps iOS no macOS | Mac próprio, ou plano grátis/limitado do serviço |
| Ícones e telas de abertura em tamanho nativo | Exigência da App Store | já temos a base em `public/` |
| Revisão da Apple | Apps que são "só um site" podem ser recusados; é preciso usar recursos nativos (notificações, Face ID) | — |

Sem a conta paga, dá para instalar pelo Xcode com um Apple ID grátis, mas o app **expira a cada 7 dias** e precisa ser
reinstalado pelo Mac.

**Passos quando for a hora**

1. `npm i @capacitor/core @capacitor/ios` e `npx cap init Caixa dev.andreluaan.caixa --web-dir dist`.
2. `npm run build && npx cap add ios && npx cap sync`.
3. Abrir `ios/App/App.xcworkspace` no Xcode (no Mac ou no serviço de build), escolher o time da conta Apple Developer e
   enviar para o TestFlight.
4. Recursos nativos que valem a pena: **Face ID para abrir o app** (`@capacitor-community/biometric-auth` ou similar) e
   **notificações locais** de contas a vencer (`@capacitor/local-notifications`), que funcionam sem servidor.

**Recomendação:** usar o app instalado pela web por algumas semanas. Se faltar Face ID ou aviso de contas vencendo,
aí vale partir para o Capacitor.
