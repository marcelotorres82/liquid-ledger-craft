# Capacitor (opção avançada)

Use este caminho se você precisar de:
- persistência local forte (SQLite),
- recursos nativos,
- estratégia local-first com sincronização.

Para seu cenário atual (até 5 pessoas), TWA costuma ser mais simples e rápido.

## Diretriz de arquitetura

- Backend continua na Vercel com Prisma/PostgreSQL.
- App mobile usa SQLite local para cache/offline.
- Sincronização por API autenticada (fila de sync, conflitos, retries).

## Quando migrar de TWA para Capacitor

- necessidade real de offline prolongado;
- necessidade de recursos nativos (arquivos/biometria/notificações avançadas);
- controle fino de armazenamento local.

