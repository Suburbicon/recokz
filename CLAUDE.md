# reco.kz — контекст для Claude Code

Сервис сверки банковских и CRM-транзакций для бизнеса. Мультитенантность по организациям (один пользователь может состоять в нескольких, выбирает «текущую»). Интеграция с онлайн-кассой Rekassa.

Расширенное описание для людей — `docs/technical-description.md`. Этот файл — для Claude: команды, соглашения, домен, ключевые места.

---

## Команды

```bash
npm run dev              # порт 5173 (НЕ 3000 — в README остался дефолтный текст create-next-app)
npm run dev:https        # с локальным HTTPS, нужны ./certs/key.pem и cert.pem
npm run dev:turbo        # порт 4000
npm run build            # включает prisma generate
npm run build-migrate    # prisma migrate deploy + generate + next build (для прод-деплоя)
npm run start
npm run lint
npm run format           # prettier

npm run prisma-migrate   # migrate dev
npm run prisma-studio    # GUI для БД
npm run prisma-generate  # после правки schema.prisma
npm run prisma-reset
npm run prisma-format
```

После любой правки `prisma/schema.prisma` запустить `npm run prisma-generate`, иначе типы `@prisma/client` устареют.

---

## Стек

| Слой | Технология |
|------|-----------|
| Язык / фреймворк | TypeScript 5, Next.js 15 (App Router), React 19 |
| API | tRPC v11 (`@/shared/lib/trpc`), react-query, superjson |
| БД | PostgreSQL + Prisma 6 |
| Auth | Clerk (`@clerk/nextjs`); организации — в `publicMetadata` пользователя |
| Валидация | Zod + react-hook-form (`@hookform/resolvers/zod`) |
| AI | Vercel AI SDK + OpenAI (`@ai-sdk/openai`) |
| Реалтайм | Pusher (канал по `organizationId`) |
| UI | Tailwind CSS 4, Radix UI, lucide-react, recharts, sonner |
| URL state | nuqs |
| Парсинг | xlsx (Excel) |

---

## Структура репозитория

```
src/
├── app/                          # Next.js App Router
│   ├── _ui/                      # компоненты лендинга
│   ├── api/                      # REST-эндпоинты вне tRPC
│   │   ├── trpc/[trpc]/          # tRPC-хендлер
│   │   ├── webhook/, webhook-ms/ # приём вебхуков
│   │   ├── create-payment/       # инициация Rekassa-платежа
│   │   ├── payment-result/, proxy/
│   │   ├── chat/                 # AI-чат
│   │   └── sync-user/            # синхронизация Clerk-пользователя
│   ├── cabinet/
│   │   ├── (reports)/            # списки и форма отчёта
│   │   └── (reconciliation)/     # экран сверки
│   ├── onboarding/, sign-in/, sign-up/
│   ├── layout.tsx, page.tsx
├── server/                       # tRPC-роутеры (по одному файлу на сущность)
│   ├── index.ts                  # appRouter — РЕГИСТРИРОВАТЬ КАЖДЫЙ НОВЫЙ РОУТЕР ЗДЕСЬ
│   ├── reports.ts, documents.ts, reconciliation.ts
│   ├── transaction.ts, transaction-type.ts
│   ├── bank-transaction.ts, crm-transaction.ts, bank-statement.ts
│   ├── organization.ts, user.ts, rekassa.ts, webhook.ts, dashboard.ts
│   ├── ai/
│   │   ├── client.ts             # openai client
│   │   ├── index.ts
│   │   └── queries/              # отдельный файл на каждый AI-запрос
│   │       ├── detect-bank.ts
│   │       ├── detect-document-type.ts
│   │       ├── detect-table-columns.ts
│   │       ├── detect-table-start-row.ts
│   │       ├── detect-image.ts
│   │       └── reconcile.ts
│   └── lib/
│       ├── encryption.ts         # AES-256-GCM, ключ REKASSA_ENCRYPTION_KEY (base64, 32 байта)
│       ├── bank-filter.ts        # isSignificantBankTransaction — единая точка фильтра Kaspi/Halyk
│       └── merge-knp-transactions.ts
├── modules/                      # UI-модули по фичам
│   ├── auth/, cabinet/, connection/, dashboard/, transaction-types/
│   ├── reports/
│   │   └── form/steps/           # шаги мастера: import-info, import-docs, import-bank, …
│   └── transactions/
│       ├── model/, table/, chat-modal/, utils.ts
├── shared/
│   ├── ui/                       # Radix-обёртки + поля форм в _fields/
│   ├── lib/
│   │   ├── trpc/{client,server}.ts
│   │   ├── prisma/index.tsx
│   │   ├── amount.ts             # форматирование сумм (БД хранит копейки int)
│   │   ├── dayjs.ts              # настроенный dayjs (локаль ru)
│   │   ├── parse-date-time.ts, parse.ts
│   │   ├── validators.ts, cn.ts, nuqs.ts, clerk.ts, storage.ts
│   ├── hooks/, providers/, models/, icons/
├── middleware.ts                 # Clerk middleware + публичные маршруты
└── global.d.ts
prisma/
├── schema.prisma
└── migrations/
docs/
├── technical-description.md      # расширенное описание для людей — не дублировать
└── integrations.md
```

В корне репозитория лежат `*.json` (`bank_transactions-09.json`, `crm_transactions*.json`, `t.json`, `tt.json`, `organizations.json`) — это старые тестовые дампы, не использовать как источник правды.

---

## Соглашения по коду

1. **Импорты** — alias `@/...` (см. `tsconfig.json` → `paths`). Не использовать относительные `../../`.
2. **Новый tRPC-роутер:**
   - Создать `src/server/<name>.ts`, экспортировать `xxxRouter = createTRPCRouter({...})`.
   - Подключить в `src/server/index.ts` (`appRouter`) — без этого роутер не существует на клиенте.
   - Использовать `protectedProcedure` из `@/shared/lib/trpc/server` (см. ниже).
3. **Контекст tRPC** (`ctx`): `userId`, `organizationId` (текущая), `organizationIds` (все), `currentOrganizationId`, `prisma`, `clerk`. **Все запросы к данным обязаны фильтровать по `ctx.organizationId`** — это граница мультитенантности. См. `src/shared/lib/trpc/server.ts:42`.
4. **Ошибки** — `throw new TRPCError({ code, message })`. Сообщения для пользователя — на русском.
5. **Валидация входа** — `z.object({...})` в `.input(...)`. Не парсить вручную.
6. **Файлы** — kebab-case (`bank-transaction.ts`, `import-docs.tsx`). Внутри `modules/<feature>/` типичные папки: `form/`, `table/`, `model/`, `chat-modal/`, `steps/`.
7. **Формы** — `react-hook-form` + `zodResolver`. Готовые поля — `src/shared/ui/_fields`.
8. **URL state** — через `nuqs` (`src/shared/lib/nuqs.ts`), не через `useState` + `useSearchParams` руками.
9. **Даты** — `dayjs` с локалью из `src/shared/lib/dayjs.ts`. `date-fns` используется точечно в нескольких местах — для нового кода предпочитать dayjs.
10. **Суммы** — в БД целые числа **в копейках** (`Transaction.amount: Int`). Форматирование — `src/shared/lib/amount.ts`. Внимание: `BankTransaction.amount` и `CrmTransaction.amount` — это **String** (исторически); при сравнении с `Transaction.amount` нужно делить на 100.

---

## Доменный глоссарий

- **Организация** — тенант. `ctx.organizationId` — обязательное поле фильтра во всех запросах. Связь user↔organization: таблица `UserOrganization` + Clerk `publicMetadata.organizationIds` / `currentOrganizationId` (см. `server.ts:14-40`). Один пользователь может состоять в нескольких организациях; «текущая» выбирается в UI (см. компонент выбора компании).
- **Отчёт (`Report`)** — период (`start_date`, `end_date`) + `cash_balance` + `status`. Статусы (enum `ReportStatus`): `import_info → import_bank → import_crm → sales → expenses → done`. Каждому соответствует шаг мастера в `src/modules/reports/form/steps/`.
- **Документ (`Document`)** — загруженный Excel: `type: bank | crm`. Для банковских дополнительно `BankDocumentType: sales_report | bank_statement` и `bankName`. Привязан к отчёту через `reportId`.
- **Транзакция (`Transaction`)** — строка из документа после парсинга. `amount: Int` (копейки), `meta: Json` хранит исходные поля Excel (включая «КНП», «Назначение платежа», банк, и т.п.).
- **`BankTransaction` / `CrmTransaction`** — **глобальные** таблицы (привязаны к организации, а не к отчёту), используются для крос-отчётной связки и Rekassa (`sentToRekassa`). Не путать с `Transaction` (строки документа конкретного отчёта). `amount` тут — `String`.
- **Сверка (`Reconciliation`)** — пара `(bankTransactionId, crmTransactionId)` внутри отчёта. Допустимы односторонние записи (одна сторона `null` = «нет пары»). Опционально привязан `typeId → TransactionType`.
- **`TransactionType`** — справочник типов операций организации (`income | expense`).
- **КНП** — Код Назначения Платежа в банковской выписке РК. КНП 190 — особый случай: несколько транзакций за одну дату нужно объединить в одну (см. `src/server/lib/merge-knp-transactions.ts`). Дата извлекается из «Назначения платежа» через `src/modules/reports/form/steps/lib/extract-date-from-payment-purpose.ts`.
- **Rekassa** — внешний сервис фискализации (онлайн-касса). Креды организации (`rekassaId`, `token`, `number`, `password`) хранятся в `Conf` в **зашифрованном** виде. Шифрование — `src/server/lib/encryption.ts` (AES-256-GCM, ключ `REKASSA_ENCRYPTION_KEY` в base64, 32 байта).
- **Clerk** — провайдер аутентификации (SSO поддерживается). Метаданные организации — в `publicMetadata` пользователя, читаются в `createTRPCContext`. Маршрутизация защищённых страниц — `src/middleware.ts`.
- **Pusher** — реалтайм. Канал — по `organizationId`, событие — создание платежа Rekassa.

---

## «Значимые» транзакции выписки банка (единая точка правды)

Для сверки и отображения на дашборде используется один helper:
**`src/server/lib/bank-filter.ts` → `isSignificantBankTransaction(meta, bank)`**.

Правила:
- **Kaspi:** `meta.bank === "Kaspi"` И `meta["КНП"] === "190"`. Транзакции КНП-190 — это агрегированные дневные продажи; обычные платежи Каспи сверке не подлежат и в дашборде/сверке выписок не показываются.
- **Halyk:** `meta.bank === "Halyk"` И `meta["Назначение платежа"]` **содержит** «Расчеты по карточкам». Эти строки — агрегированные зачисления по картам за день, именно они идут в сверку. Остальные движения по Halyk-выписке отбрасываются.

Где используется:
- `src/server/bank-statement.ts` → `getRows` (дашборд /cabinet/dashboard/bank/[bank]).
- Любой новый код, выбирающий «значимые» транзакции из выписки банка, **обязан** использовать этот helper — не дублировать логику.

UI-фильтры в `src/modules/reports/form/steps/import-sales.tsx` имеют свою логику и **показывают другой срез данных**: для Halyk там, наоборот, исключаются «Расчеты по карточкам» (показываются обычные движения), а для Kaspi КНП-190 раскладывается в гармошку с sales_report. Это намеренное расхождение — на дашборде и в шаге сверки нужны разные представления одних и тех же транзакций. Не «синхронизировать» вслепую: при изменении бизнес-правил решать, какое именно представление меняется.

---

## Логика сверки (источник правды для будущих правок)

Сверка реализована в **двух местах**, оба нужно держать в голове:

**Код:**
- tRPC-процедура: `src/server/reconciliation.ts` → `reconciliationRouter.reconcile`
- AI-вариант: `src/server/ai/queries/reconcile.ts` (GPT-промпт с правилами)
- UI: `src/modules/reports/form/steps/import-result.tsx` + модалки в `steps/modals/`
- Слияние КНП-190: `src/server/lib/merge-knp-transactions.ts` (выполняется ДО сверки, на этапе парсинга банковского документа)

**Алгоритм `reconciliation.reconcile` (`src/server/reconciliation.ts`):**

1. Загружает `Report` со всеми `documents.transactions`, проверяет `organizationId`.
2. Разделяет на банковские и CRM строки документа.
3. **Проход 1 (по `transactionId`):** для каждой банковской ищет в глобальной `BankTransaction` запись с тем же `transactionId` и её `crmTransaction[]`. Если есть — создаёт сверки, сопоставляя `c.amount/100 === crm.amount` и `transactionId`.
4. **Проход 2 (фоллбэк):** для непривязанных банковских ищет CRM с равной суммой, тем же `meta.bank` и разницей даты < 24 часа. Найденная CRM удаляется из пула (1-к-1).
5. **Проход 3:** оставшиеся CRM без пары записываются как `bankTransactionId: null`.

**AI-вариант (`reconcile.ts`):** GPT с правилом «сумма равна И |Δдата| < 24ч»; отдельно выделяет CRM-наличные (по слову «Наличные» в `meta`).

**Инварианты:**
- 24 часа — порог совпадения по дате.
- `Transaction.amount` — копейки (`Int`), `BankTransaction.amount` / `CrmTransaction.amount` — `String`. При сравнении делить на 100.
- КНП-190 объединяются ДО запуска сверки.

**Правка логики сверки:** менять одновременно код в `reconciliation.ts` и AI-промпт в `reconcile.ts` — они описывают одну и ту же задачу с разных сторон.

---

## Окружение

Полный список — в `.env.example`. Минимум для запуска приложения (вход + БД):

- `DATABASE_URL` — Postgres
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — Clerk

Дополнительно (фичи работают только при наличии):

- `OPENAI_API_KEY` — AI-парсинг документов и AI-сверка
- `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` — реалтайм для Rekassa-платежей
- `NEXT_PUBLIC_API_REKASSA`, `NEXT_PUBLIC_API_KEY_REKASSA` — клиентский прокси к Rekassa
- `REKASSA_ENCRYPTION_KEY` — base64-кодированный 32-байтный ключ AES-256-GCM для шифрования кредов Rekassa в `Conf`

---

## Что НЕ делать

- Не запрашивать данные без фильтра по `ctx.organizationId` — это утечка между тенантами.
- Не менять `ReportStatus` enum в одном месте: статусы завязаны на шаги мастера в `src/modules/reports/form/steps/` и на `reports.ts`. Любое изменение — синхронно во всех местах + миграция Prisma.
- Не править логику сверки только в `reconciliation.ts` — обязательно проверять AI-промпт `src/server/ai/queries/reconcile.ts`.
- Не добавлять tRPC-роутер без регистрации в `src/server/index.ts` — клиент его не увидит.
- Не коммитить `.env`, реальные креды Rekassa, реальные дампы транзакций. В корне уже лежат старые JSON-дампы — новые не добавлять.
- Не путать `Transaction` (строка документа отчёта) и `BankTransaction`/`CrmTransaction` (глобальные таблицы). Разные типы `amount` (Int vs String), разные назначения.
