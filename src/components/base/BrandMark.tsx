import clsx from 'clsx'
import { useId, type CSSProperties } from 'react'
import styles from './BrandMark.module.css'

/**
 * 品牌图形：一圈轨道 + 一颗四芒星 + 一颗沿线运行的卫星点。
 *
 * 产品不再用文字署名——标记本身就是品牌。
 * 图形在 16px 下仍可辨识：外圈提供轮廓，四芒星提供记忆点，卫星点让静态图标有方向感。
 * 只有欢迎页使用 animated，侧边栏/设置标题保持静止，避免整页长期运动分散注意力。
 */
export const BrandMark = ({
  size = 28,
  animated = false,
  className,
}: {
  size?: number
  animated?: boolean
  className?: string
}) => {
  // useId 会带冒号，不能直接放进 url(#id)，这里只保留安全字符。
  const gradientId = `brand-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <span
      aria-hidden
      className={clsx(styles.mark, animated && styles.animated, className)}
      style={{ '--mark-size': `${size}px` } as CSSProperties}
    >
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient
            id={gradientId}
            x1="6"
            y1="4"
            x2="42"
            y2="44"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#7E9CFF" />
            <stop offset="0.55" stopColor="#4D6BFE" />
            <stop offset="1" stopColor="#3557F5" />
          </linearGradient>
        </defs>
        {/* 轨道与卫星点共享旋转中心，转动时只有卫星点可见地绕行。 */}
        <g className={styles.ring}>
          <circle
            cx="24"
            cy="24"
            r="20.25"
            stroke={`url(#${gradientId})`}
            strokeOpacity="0.3"
            strokeWidth="1.5"
          />
          <circle cx="44.25" cy="24" r="2" fill={`url(#${gradientId})`} />
        </g>
        <path
          className={styles.spark}
          d="M24 4c1 10 10 19 20 20-10 1-19 10-20 20-1-10-10-19-20-20 10-1 19-10 20-20Z"
          fill={`url(#${gradientId})`}
        />
        {/* 中心呼吸点把四芒星从“星形”拉回“智能体”的联想。 */}
        <circle className={styles.core} cx="24" cy="24" r="3.4" fill="#fff" />
      </svg>
    </span>
  )
}
