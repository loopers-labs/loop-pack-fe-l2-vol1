import Image from 'next/image'
import styles from './SelectToggleIcon.module.css'

type SelectToggleIconProps = {
  isOpen: boolean
}

/*
 * 3개 select 컴포넌트가 이 아이콘 마크업을 글자 그대로 복붙하고 있었다 — "마크업은 서로
 * 독립적"이라는 근거와 실제로 어긋나는 부분이라 여기로 뽑았다.
 * next/image's optimizer rejects local SVGs by default; unoptimized serves it as-is.
 */
export const SelectToggleIcon = ({ isOpen }: SelectToggleIconProps) => (
  <Image
    src="/toggle.svg"
    alt=""
    aria-hidden
    width={20}
    height={20}
    unoptimized
    className={[styles.toggleIcon, isOpen && styles.toggleIconOpen].filter(Boolean).join(' ')}
  />
)
