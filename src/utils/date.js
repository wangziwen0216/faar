import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

export function formatDate(iso) {
  return dayjs(iso).format('YYYY年M月D日')
}

export function formatDateTime(iso) {
  return dayjs(iso).format('YYYY-MM-DD HH:mm')
}

export function archiveLabel(year, month) {
  return `${year}年${parseInt(month, 10)}月`
}
