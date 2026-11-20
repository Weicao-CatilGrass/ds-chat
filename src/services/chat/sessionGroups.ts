import { translate } from '../../i18n/index.js'
import { monthKey } from '../../utils/format.js'
import type { SessionSummary } from './types.js'

const DAY = 86_400_000

const startOfDay = (time: number) => new Date(time).setHours(0, 0, 0, 0)

/** 分组的时间粒度；界面用图形表达，文案只留给 tooltip 与读屏。 */
export type SessionGroupKind = 'today' | 'yesterday' | 'week' | 'month' | 'archive'

/** 分组：今天 / 昨天 / 7 天内 / 30 天内 / 按月 */
export const groupSessions = (sessions: SessionSummary[], now: number, t = translate) => {
  const groups: {
    key: string
    label: string
    kind: SessionGroupKind
    sessions: SessionSummary[]
  }[] = []
  for (const session of sessions) {
    const diff = Math.floor((now - startOfDay(session.updatedAt)) / DAY)
    const key =
      diff <= 0
        ? 'sessionHistoryTimelineLabelToday'
        : diff <= 1
          ? 'sessionHistoryTimelineLabelYesterday'
          : diff < 7
            ? 'sessionHistoryTimelineLabel7days'
            : diff < 30
              ? 'sessionHistoryTimelineLabel30days'
              : null
    const kind: SessionGroupKind =
      diff <= 0
        ? 'today'
        : diff <= 1
          ? 'yesterday'
          : diff < 7
            ? 'week'
            : diff < 30
              ? 'month'
              : 'archive'
    const groupKey = key ?? monthKey(session.updatedAt) ?? ''
    const last = groups.at(-1)
    if (last?.key === groupKey) {
      last.sessions.push(session)
    } else {
      groups.push({ key: groupKey, label: key ? t(key) : groupKey, kind, sessions: [session] })
    }
  }
  return groups
}
