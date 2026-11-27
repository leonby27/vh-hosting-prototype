import { PageAlert, Surface } from './ui/index.js'
import './dns-editor-preview.css'

export default function DnsEditorPreview() {
  return (
    <section className="dns-editor-preview">
      <PageAlert
        tone="warning"
        title="Для домена включена защита от DDoS"
        description="Изменение DNS-записей или NS-серверов может повлиять на работу защиты. Проверьте, что после изменений домен по-прежнему указывает на защищённый IP."
      />
      <Surface appearance="card" className="dns-editor-preview-placeholder">
        Здесь такой же интерфейс DNS-редактора, как на продакшене
      </Surface>
    </section>
  )
}
