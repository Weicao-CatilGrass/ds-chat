import clsx from 'clsx'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslate } from '../../i18n/index.js'
import {
  IconArchiveOutline14,
  IconHistoryOutline14,
  IconInfoOutline14,
  IconMoonOutline14,
  IconPanelLeftOutline16,
  IconSettingsOutline16,
  IconSunOutline14,
  IconWeekOutline14,
  NewChatIcon,
} from '../base/icons.js'
import { setSiderCollapsed } from '../../services/settings.js'
import { groupSessions, type SessionGroupKind } from '../../services/chat/sessionGroups.js'
import { newChat, removeSession, useChatStore } from '../../services/chat/store.js'
import type { SessionSummary } from '../../services/chat/types.js'
import { BrandMark } from '../base/BrandMark.js'
import { Button } from '../base/Button.js'
import { IconButton } from '../base/IconButton.js'
import { Modal } from '../base/Modal.js'
import { Tooltip } from '../base/Tooltip.js'
import { showToast } from '../base/toastState.js'
import { openSettings } from '../settings/settingsDialogState.js'
import { closeMobileSider, useMobileSider } from './mobileSiderState.js'
import { SessionItem } from './SessionItem.js'
import styles from './Sider.module.css'

/** 时间分组 → 图形。今天的太阳、昨天的月亮、7 天内的日历、30 天内的时钟、更早的归档盒。 */
const groupIcons: Record<SessionGroupKind, ReactNode> = {
  today: <IconSunOutline14 />,
  yesterday: <IconMoonOutline14 />,
  week: <IconWeekOutline14 />,
  month: <IconHistoryOutline14 />,
  archive: <IconArchiveOutline14 />,
}

/**
 * 侧边栏不写产品名，也不写按钮文字：
 * - 顶部用一个轨道标记代替原来的产品名文案；
 * - 新建对话是左侧的圆形 + 按钮，形状本身就是入口；
 * - 时间分组用日/月/日历图形分隔，完整文案只在悬停和读屏时出现；
 * - 底部只留说明与设置两个图标，说明文案改为点击/悬停后出现。
 */
export const Sider = ({ mobile = false }: { mobile?: boolean }) => {
  const t = useTranslate()
  const sessions = useChatStore((state) => state.sessions)
  const activeId = useChatStore((state) => state.activeId)
  const [now, setNow] = useState(Date.now)
  const groups = useMemo(() => groupSessions(sessions, now, t), [sessions, now, t])
  const [deleting, setDeleting] = useState<SessionSummary | null>(null)
  const [deletePending, setDeletePending] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const refresh = () => {
      clearTimeout(timer)
      const time = Date.now()
      setNow(time)
      const midnight = new Date(time).setHours(24, 0, 0, 0)
      timer = setTimeout(refresh, midnight - time)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }
    refresh()
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', refresh)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return (
    <div className={clsx(styles.sider, mobile && styles.mobile)}>
      <div className={styles.top}>
        <BrandMark size={26} />
        <IconButton
          size="m"
          icon={<IconPanelLeftOutline16 />}
          tooltip={t('collapseSiderbarButton')}
          tooltipPlacement="bottom"
          onClick={() => (mobile ? closeMobileSider() : setSiderCollapsed(true))}
        />
      </div>
      <Tooltip content={t('newChat')} placement="bottom">
        <button
          type="button"
          className={styles.newChat}
          aria-label={t('newChat')}
          onClick={() => {
            newChat()
            closeMobileSider()
          }}
        >
          <NewChatIcon />
        </button>
      </Tooltip>
      <div className={styles.listWrap}>
        <div className={styles.list}>
          {groups.map((group) => (
            <div key={group.key} className={styles.section}>
              {/* 纯图形分隔：图形表达时间粒度，文字只在 title/读屏中可查，不占版面。 */}
              <div
                className={styles.sectionHeader}
                role="heading"
                aria-level={2}
                aria-label={group.label}
                title={group.label}
              >
                <span className={styles.sectionRule} />
                <span className={styles.sectionIcon}>{groupIcons[group.kind]}</span>
                <span className={styles.sectionRule} />
              </div>
              {group.sessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  active={session.id === activeId}
                  onDelete={() => setDeleting(session)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.bottom}>
        {/* 免责说明不再常驻在页面上：桌面悬停、移动端点击时才出现。 */}
        <IconButton
          size={mobile ? 'xl' : 'm'}
          icon={<IconInfoOutline14 />}
          tooltip={t('contentCaveat')}
          tooltipPlacement="top"
          onClick={() => showToast({ key: 'contentCaveat' })}
        />
        <IconButton
          size={mobile ? 'xl' : 'm'}
          icon={<IconSettingsOutline16 />}
          tooltip={t('settings')}
          tooltipPlacement="top"
          onClick={() => openSettings('general')}
        />
      </div>
      {deleting ? (
        <Modal
          title={t('deleteSessionModalContentTitle')}
          onClose={() => {
            if (!deletePending) {
              setDeleting(null)
            }
          }}
          footer={
            <>
              <Button variant="outlined" disabled={deletePending} onClick={() => setDeleting(null)}>
                {t('cancel')}
              </Button>
              <Button
                variant="danger"
                disabled={deletePending}
                onClick={async () => {
                  setDeletePending(true)
                  try {
                    if (await removeSession(deleting.id)) {
                      setDeleting(null)
                    } else {
                      showToast({ key: 'sessionDeleteFailed', type: 'error' })
                    }
                  } finally {
                    setDeletePending(false)
                  }
                }}
              >
                {t('delete')}
              </Button>
            </>
          }
        >
          {t('deleteSessionWithFilesDescription')}
        </Modal>
      ) : null}
    </div>
  )
}

/** 移动端抽屉：浮在页面上方，点空白区域关闭。 */
export const MobileSider = () => {
  const open = useMobileSider((state) => state.open)
  if (!open) {
    return null
  }
  return (
    <>
      <div className={styles.drawerMask} onClick={closeMobileSider} />
      <div className={styles.drawer}>
        <Sider mobile />
      </div>
    </>
  )
}
