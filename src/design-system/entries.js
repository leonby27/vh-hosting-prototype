import { ButtonExample } from './ButtonExample.jsx'
import { Changelog } from './Changelog.jsx'
import { CalendarExample, ChoiceExample, SearchExample, SelectExample, TextFieldExample } from './ControlsExamples.jsx'
import { AlertExample, HintExample, SpinnerExample, ToastExample, TooltipExample } from './FeedbackExamples.jsx'
import { ColorsExample, IconsExample, ShadowsExample, TypographyExample } from './FoundationExamples.jsx'
import { MenuExample, PaginationExample, TabsExample } from './NavigationExamples.jsx'

export const catalogEntries = [
  { id: 'button', icon: 'cursor-click', title: 'Кнопки', Example: ButtonExample },
  { id: 'text-field', icon: 'textbox', title: 'Инпуты', Example: TextFieldExample },
  { id: 'search', icon: 'magnifying-glass', title: 'Поиск', Example: SearchExample },
  { id: 'select', icon: 'caret-circle-down', title: 'Селекты', Example: SelectExample },
  { id: 'menu', icon: 'list', title: 'Выпадающие списки', menuLabel: 'Дропдауны', Example: MenuExample },
  { id: 'choice', icon: 'check-square', title: 'Флажки и переключатели', menuLabel: 'Флажки и свитчи', Example: ChoiceExample },
  { id: 'calendar', icon: 'calendar-blank', title: 'Календарь', Example: CalendarExample },
  { id: 'tabs', icon: 'tabs', title: 'Вкладки', Example: TabsExample },
  { id: 'pagination', icon: 'dots-three', title: 'Пагинация', Example: PaginationExample },
  { id: 'spinner', icon: 'spinner-gap', title: 'Индикаторы загрузки', menuLabel: 'Загрузка', Example: SpinnerExample },
  { id: 'alert', icon: 'warning', title: 'Алерты', Example: AlertExample },
  { id: 'toast', icon: 'bell', title: 'Всплывающие уведомления', menuLabel: 'Уведомления', Example: ToastExample },
  { id: 'tooltip', icon: 'question', title: 'Подсказки', Example: TooltipExample },
  { id: 'feature-hint', icon: 'sparkle', title: 'Новая фича', Example: HintExample },
  { id: 'icons', icon: 'shapes', title: 'Иконки', Example: IconsExample },
  { id: 'colors', icon: 'palette', title: 'Цвета', Example: ColorsExample },
  { id: 'typography', icon: 'text-aa', title: 'Типографика', Example: TypographyExample },
  { id: 'shadows', icon: 'stack', title: 'Тени', Example: ShadowsExample },
  { id: 'changelog', icon: 'history', title: 'Changelog', Example: Changelog },
]
