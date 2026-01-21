## Rekassa

## МойСклад
1. Сгенерить API ключ в личном кабинете
2. Отправить запрос на добавление webhook `https://api.moysklad.ru/api/remap/1.2/entity/webhook`
Payload: {
  "url": "https://www.reco.kz/api/webhook-ms/{companyId}/{API-key}",
  "action": "CREATE",
  "entityType": "customerorder"
}

## Altegio
1. Зайти в раздел Webhook в настройках Личного кабинета
2. Добавить webhook c URL `https://www.reco.kz/api/webhook/{companyId}`