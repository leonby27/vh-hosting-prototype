export const apiAddress = 'https://public-api.timeweb.ru'
export const apiDocsUrl = 'https://timeweb.com/ru/docs/publichnyj-api-timeweb/metody-api-dlya-virtualnogo-hostinga/'
export const mcpAddress = `${apiAddress}/mcp`
export const secretPlaceholder = 'twh_ВАШ_КЛЮЧ'

export const permissions = [
  { id: 'sites', label: 'Сайты', read: 'Сайты и привязанные домены', write: 'Управление сайтами и привязками' },
  { id: 'domains', label: 'Домены', read: 'Домены и поддомены', write: 'Создание и удаление поддоменов' },
  { id: 'dns', label: 'DNS', read: 'Записи DNS', write: 'Управление записями DNS' },
  { id: 'ssl', label: 'SSL-сертификаты', read: 'Сертификаты', write: 'Выпуск и продление' },
  { id: 'databases', label: 'Базы данных', read: 'Список баз', write: 'Управление базами и доступом' },
  { id: 'mail', label: 'Почта', read: 'Почтовые ящики', write: 'Управление почтовыми ящиками' },
  { id: 'crontab', label: 'Crontab', read: 'Задания', write: 'Управление заданиями и уведомлениями' },
  { id: 'backups', label: 'Резервные копии', read: 'Список копий', write: 'Создание, удаление и восстановление' },
  { id: 'account', label: 'Аккаунт', read: 'Баланс, тариф и услуги' },
]

export const upcomingFiles = {
  id: 'files', label: 'Файлы', read: 'Просмотр папок и скачивание файлов',
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
  ['Claude Code', 'Выполните команду в терминале. Проверить подключение можно командой /mcp.',
    `claude mcp add --transport http timeweb ${mcpAddress} --header "Authorization: Bearer ${secretPlaceholder}"`],
  ['Claude Desktop', 'Добавьте сервер в claude_desktop_config.json и перезапустите Claude Desktop. Для mcp-remote нужен Node.js.',
    json({ mcpServers: { timeweb: {
      command: 'npx', args: ['-y', 'mcp-remote', mcpAddress, '--header', 'Authorization:${TW_AUTH}'],
      env: { TW_AUTH: `Bearer ${secretPlaceholder}` },
    } } })],
  ['Cursor', 'Добавьте сервер в ~/.cursor/mcp.json или в .cursor/mcp.json внутри проекта.',
    json({ mcpServers: { timeweb: httpServer } })],
  ['VS Code', 'Добавьте сервер в .vscode/mcp.json в проекте и нажмите Start над его именем.',
    json({ servers: { timeweb: { type: 'http', ...httpServer } } })],
  ['Windsurf', 'Добавьте сервер в ~/.codeium/windsurf/mcp_config.json и обновите список серверов MCP.',
    json({ mcpServers: { timeweb: { serverUrl: mcpAddress, headers: httpServer.headers } } })],
  ['Codex', 'Добавьте сервер в ~/.codex/config.toml и задайте переменную окружения TIMEWEB_API_KEY.',
    `[mcp_servers.timeweb]\nurl = "${mcpAddress}"\nbearer_token_env_var = "TIMEWEB_API_KEY"`],
  ['Другие', 'Укажите адрес HTTP-сервера и заголовок авторизации в настройках клиента.',
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
