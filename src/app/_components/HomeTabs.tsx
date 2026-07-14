'use client'

import { useState, type ReactNode } from 'react'
import styles from './HomeTabs.module.css'

type TabKey = 'select' | 'dialog'

type HomeTabsProps = {
  selectPanel: ReactNode
  dialogPanel: ReactNode
}

/*
 * 두 패널은 이미 서버에서 렌더된 트리를 그대로 prop으로 받는다 — 이 컴포넌트는 어느 걸 보여줄지만
 * 정한다. 탭을 바꿔도 언마운트하지 않고 hidden으로만 감춘다 — 그래야 controlled Dialog 데모의
 * eventLog 같은 내부 state가 탭 전환마다 초기화되지 않는다.
 * 빠른 동작 확인용이라 화살표 키 이동 같은 완전한 탭 패턴(roving tabindex)은 생략했다.
 */
export const HomeTabs = ({ selectPanel, dialogPanel }: HomeTabsProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>('select')

  return (
    <div>
      <div className={styles.tabList} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'select'}
          className={[styles.tab, activeTab === 'select' && styles.tabActive]
            .filter(Boolean)
            .join(' ')}
          onClick={() => setActiveTab('select')}
        >
          Select
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'dialog'}
          className={[styles.tab, activeTab === 'dialog' && styles.tabActive]
            .filter(Boolean)
            .join(' ')}
          onClick={() => setActiveTab('dialog')}
        >
          Dialog
        </button>
      </div>
      <div className={styles.panel} hidden={activeTab !== 'select'}>
        {selectPanel}
      </div>
      <div className={styles.panel} hidden={activeTab !== 'dialog'}>
        {dialogPanel}
      </div>
    </div>
  )
}
