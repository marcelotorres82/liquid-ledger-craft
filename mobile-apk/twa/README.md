# TWA (APK a partir do app web)

## Pré-requisitos

1. App publicado na Vercel com HTTPS.
2. PWA válido no app:
- `manifest.webmanifest`
- service worker
- ícones
3. Java + Android SDK instalados na máquina.
4. Conta Google Play apenas se quiser publicar loja (não obrigatório para uso privado).

## Fluxo recomendado

1. Deploy de produção do app web.
2. Validar PWA no domínio final.
3. Gerar projeto TWA com Bubblewrap.
4. Build/assinatura do APK.
5. Distribuir APK privado para os 5 usuários.

## Comandos base (alto nível)

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://SEU_DOMINIO/app/manifest.webmanifest
bubblewrap build
```

## Sem instalação global (recomendado para evitar `comando não encontrado`)

```bash
npx @bubblewrap/cli init --manifest https://SEU_DOMINIO/app/manifest.webmanifest
npx @bubblewrap/cli update
npx @bubblewrap/cli build
```

## Projeto já pronto neste repositório

Este repo já contém um projeto TWA inicializado em:

`mobile-apk/twa/app-financeiro-twa`

Fluxo típico para gerar um novo APK (após um novo deploy do app web):

```bash
cd mobile-apk/twa/app-financeiro-twa
npx @bubblewrap/cli update --manifest=https://app-financeiro-ten-rose.vercel.app/app/manifest.webmanifest
npx @bubblewrap/cli build
```

O APK assinado costuma ser gerado em `mobile-apk/twa/app-financeiro-twa/app/build/outputs/apk/release/`.

## Atualização após novo deploy

Se você já inicializou o projeto TWA uma vez:

```bash
cd /CAMINHO/DO/PROJETO-TWA
npx @bubblewrap/cli update --manifest=https://SEU_DOMINIO/app/manifest.webmanifest
npx @bubblewrap/cli build
```

## Observações

- O app Android consumirá a **mesma API backend** na Vercel.
- Dados continuam centralizados no PostgreSQL/Prisma.
- Para não misturar dados entre pessoas, cada pessoa deve usar login próprio.
- Para não aparecer a barra do navegador, o domínio deve servir `/.well-known/assetlinks.json` com o `packageId` e o fingerprint do APK (arquivo no repo: `public/.well-known/assetlinks.json`).
