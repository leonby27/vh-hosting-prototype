export const apiAddress = 'https://public-api.timeweb.ru'
export const apiDocsUrl = 'https://timeweb.com/ru/docs/publichnyj-api-timeweb/metody-api-dlya-virtualnogo-hostinga/'
export const mcpAddress = `${apiAddress}/mcp`
export const secretPlaceholder = 'twh_ВАШ_КЛЮЧ'

export const apiKeysPreset = { id: 'api-keys-filled', label: 'Выпущено 5 ключей', requiresPreset: true }

export const demoApiKeys = [
  { name: 'Claude Desktop', suffix: '3fQa', age: 6, duration: '90', preset: 'Только чтение' },
  { name: 'Terraform', suffix: 'vYb8', age: 24, duration: '365', preset: 'Домены и DNS', note: 'Управление DNS рабочих сайтов' },
  { name: 'Отчёты по аккаунту', suffix: 'Lm0c', age: 48, duration: 'none', preset: 'Только чтение' },
  { name: 'Развёртывание сайта', suffix: 'Q7dk', age: 64, duration: '90', preset: 'Сайты и базы' },
  { name: 'Почтовая интеграция', suffix: 'n2Rp', age: 95, duration: '90', preset: 'Почта' },
]

export const permissions = [
  { id: 'sites', label: 'Сайты', read: 'Просмотр сайтов и их доменов', write: 'Управление сайтами и привязками' },
  { id: 'domains', label: 'Домены', read: 'Просмотр доменов и поддоменов', write: 'Создание и удаление поддоменов' },
  { id: 'dns', label: 'DNS', read: 'Просмотр записей DNS', write: 'Управление записями DNS' },
  { id: 'ssl', label: 'SSL-сертификаты', read: 'Просмотр SSL-сертификатов', write: 'Выпуск и продление сертификатов' },
  { id: 'databases', label: 'Базы данных', read: 'Просмотр списка баз данных', write: 'Управление базами и доступом' },
  { id: 'mail', label: 'Почта', read: 'Просмотр почтовых ящиков', write: 'Управление почтовыми ящиками' },
  { id: 'crontab', label: 'Crontab', read: 'Просмотр заданий Crontab', write: 'Управление заданиями и уведомлениями' },
  { id: 'backups', label: 'Резервные копии', read: 'Просмотр резервных копий', write: 'Создание, удаление и восстановление' },
  { id: 'account', label: 'Аккаунт', read: 'Просмотр баланса, тарифа и услуг' },
]

export const upcomingFiles = {
  id: 'files', label: 'Файлы', read: 'Просмотр папок, скачивание файлов',
  write: 'Загрузка, изменение и удаление файлов', upcoming: true,
}

export const capabilities = [...permissions.slice(0, 6), upcomingFiles, ...permissions.slice(6)]

export const presets = [
  ['Только чтение', 'read'],
  ['Полный доступ', 'write'],
  ['Сайты и базы', 'write', ['sites', 'databases']],
  ['Домены и DNS', 'write', ['domains', 'dns', 'ssl']],
  ['Почта', 'write', ['mail']],
]

const json = value => JSON.stringify(value, null, 2)
const httpServer = { url: mcpAddress, headers: { Authorization: `Bearer ${secretPlaceholder}` } }

export const clients = [
  ['Claude Code', ['Выполните подготовленную команду в терминале.', 'Проверьте подключение командой /mcp.'],
    [
      'claude mcp add',
      '  --transport http timeweb',
      `  ${mcpAddress}`,
      `  --header "Authorization: Bearer ${secretPlaceholder}"`,
    ].join(' \\' + '\n')],
  ['Claude Desktop', ['Добавьте сервер из примера в claude_desktop_config.json. Для mcp-remote нужен Node.js.', 'Перезапустите Claude Desktop.'],
    json({ mcpServers: { timeweb: {
      command: 'npx', args: ['-y', 'mcp-remote', mcpAddress, '--header', 'Authorization:${TW_AUTH}'],
      env: { TW_AUTH: `Bearer ${secretPlaceholder}` },
    } } })],
  ['Cursor', ['Добавьте сервер из примера в ~/.cursor/mcp.json или в .cursor/mcp.json внутри проекта.'],
    json({ mcpServers: { timeweb: httpServer } })],
  ['VS Code', ['Добавьте сервер из примера в .vscode/mcp.json в проекте.', 'Нажмите Start над именем сервера.'],
    json({ servers: { timeweb: { type: 'http', ...httpServer } } })],
  ['Windsurf', ['Добавьте сервер из примера в ~/.codeium/windsurf/mcp_config.json.', 'Обновите список серверов MCP.'],
    json({ mcpServers: { timeweb: { serverUrl: mcpAddress, headers: httpServer.headers } } })],
  ['Codex', ['Добавьте сервер из примера в ~/.codex/config.toml.'],
    `[mcp_servers.timeweb]\nurl = "${mcpAddress}"\nbearer_token_env_var = "TIMEWEB_API_KEY"`,
    'Укажите ключ в переменной окружения TIMEWEB_API_KEY.'],
  ['Другие', ['Укажите адрес HTTP-сервера и заголовок авторизации из примера в настройках клиента.'],
    `${mcpAddress}\nAuthorization: Bearer ${secretPlaceholder}`],
]

export const journal = [
  ['12 ноя, 14:02', 'vYb8', 'API', 'GET /api/sites', '192.0.2.4', 200],
  ['12 ноя, 11:31', '3fQa', 'MCP', 'dns_records_list', '198.51.100.31', 200],
  ['12 ноя, 11:30', '3fQa', 'MCP', 'sites_list', '198.51.100.31', 200],
  ['12 ноя, 11:29', '3fQa', 'MCP', 'dns_record_create', '198.51.100.31', 403],
  ['12 ноя, 11:20', '3fQa', 'API', 'GET /api/key', '198.51.100.31', 200],
  ['12 ноя, 09:12', 'Lm0c', 'MCP', 'account_info', '198.51.100.31', 200],
  ['11 ноя, 22:41', 'Lm0c', 'MCP', 'mail_boxes_list', '198.51.100.31', 200],
  ['11 ноя, 18:05', 'vYb8', 'Terraform', 'GET /api/dns/example.com/records', '203.0.113.90', 200],
  ['11 ноя, 18:05', 'vYb8', 'Terraform', 'POST /api/dns/example.com/records', '203.0.113.90', 429],
  ['27 окт, 03:00', 'vYb8', 'API', 'POST /api/backups', '192.0.2.4', 201],
  ['30 сен, 03:00', 'Q7dk', 'API', 'POST /api/backups', '203.0.113.90', 201],
  ['30 сен, 02:59', 'Q7dk', 'API', 'GET /api/databases', '203.0.113.90', 200],
]
