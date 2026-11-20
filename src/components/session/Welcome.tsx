import { useIsMobile } from '../../app/viewport.js'
import { BrandMark } from '../base/BrandMark.js'
import { ChatInput } from '../chatInput/ChatInput.js'
import { MobileHeader } from './MobileHeader.js'
import styles from './Welcome.module.css'

/**
 * 新对话页的主视觉不再写“今天有什么可以帮到你？”。
 * 轨道标记 + 缓慢的环线动画承担“开始对话”的情绪，输入框的位置本身说明下一步该做什么。
 * 免责声明也从常驻文字移到侧边栏的信息图标，页面只剩用户可以立即操作的东西。
 */
export const Welcome = () => {
  const isMobile = useIsMobile()
  return (
    <div className={styles.container}>
      {isMobile ? <MobileHeader /> : null}
      <div className={styles.welcome}>
        <div className={styles.hero} aria-hidden>
          <span className={styles.halo} />
          <span className={styles.ringOuter} />
          <span className={styles.ringInner} />
          <BrandMark size={isMobile ? 56 : 80} animated className={styles.mark} />
        </div>
        <ChatInput sessionId={null} />
      </div>
    </div>
  )
}
