import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/ru'; // Не забудьте импортировать локаль

// Расширяем dayjs плагинами
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('ru');

export const formatDate = (date: string | Date): string => {
  // Проверяем, что дата валидна
  if (!date || !dayjs(date).isValid()) {
    return "Неверная дата";
  }
  
  // 1. Создаем объект dayjs из входной даты (он поймет, что строка с 'Z' - это UTC).
  // 2. Конвертируем время в часовой пояс 'Asia/Almaty' (UTC+05:00).
  // 3. Форматируем в нужный вид.
  return dayjs(date)
    .tz("Asia/Almaty")
    .format("D MMM YYYY г., HH:mm");
};