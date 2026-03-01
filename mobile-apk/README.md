# Mobile APK (separado do app web)

Este diretório isola o projeto mobile para não misturar com o código web/API.

## Recomendação para seu caso (até 5 pessoas)

Use **PWA + TWA** primeiro:
- menor custo de manutenção;
- aproveita o app web já hospedado na Vercel;
- Prisma continua no backend (nada de Prisma no Android).

Use **Capacitor + SQLite** apenas se você realmente precisar de offline robusto e sincronização local-first.

## Estrutura

- `mobile-apk/twa/`: fluxo recomendado para gerar APK via Bubblewrap.
- `mobile-apk/capacitor/`: opção futura para app nativo com SQLite local.

## Isolamento de dados (importante)

O backend já usa `usuario_id` nas tabelas e nas queries.  
Para 5 pessoas, a prática recomendada é:
- 1 usuário por pessoa (login separado),
- nunca compartilhar a mesma conta.

