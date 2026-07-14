"use client";

import { useState } from "react";
import { TextSelect } from "@/components/ui/select/demos/TextSelect";
import { SizeSelect } from "@/components/ui/select/demos/SizeSelect";
import { ThumbnailSelect } from "@/components/ui/select/demos/ThumbnailSelect";
import { ControlledSelect } from "@/components/ui/select/demos/ControlledSelect";
import { UncontrolledModal } from "@/components/ui/dialog/demos/UncontrolledModal";
import { ControlledNonModal } from "@/components/ui/dialog/demos/ControlledNonModal";
import { AsChildModal } from "@/components/ui/dialog/demos/AsChildModal";
import styles from "./page.module.css";

const DEMO_LABELS = {
  size: "① 사이즈",
  thumbnail: "② 썸네일",
  text: "③ 텍스트 목록",
  controlled: "④ controlled (리모컨 ↔ select 양방향)",
} as const;

export default function Home() {
  const [onChangeProbeByDemo, setOnChangeProbeByDemo] = useState<
    Record<string, unknown>
  >({});
  const handleOnChangeProbe = (demoLabel: string, selectedOption: unknown) =>
    setOnChangeProbeByDemo((prev) => ({
      ...prev,
      [demoLabel]: selectedOption,
    }));

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.title}>
          Downshift참고한 Select 헤드리스 + 훅 형식 데모
        </div>
        <div>
          1~3까지는 uncontrolled로 과제 요구사항 구현, 4번은 controlled 예시.
          선택 시 onChange 출력 확인용.
        </div>
      </header>

      <section className={styles.changeLog}>
        <div className={styles.changeLogTitle}>
          useSelecton훅 onChange 출력 확인용(선택 시 갱신)
        </div>
        {Object.values(DEMO_LABELS).map((label) => (
          <div key={label} className={styles.changeLogItem}>
            <span className={styles.changeLogLabel}>{label}</span>
            <span>{JSON.stringify(onChangeProbeByDemo[label] ?? null)}</span>
          </div>
        ))}
      </section>

      <section className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>{DEMO_LABELS.size}</div>
          <SizeSelect
            onChange={(option) => handleOnChangeProbe(DEMO_LABELS.size, option)}
          />
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>{DEMO_LABELS.thumbnail}</div>
          <ThumbnailSelect
            onChange={(product) =>
              handleOnChangeProbe(DEMO_LABELS.thumbnail, product)
            }
          />
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>{DEMO_LABELS.text}</div>
          <TextSelect
            onChange={(pack) => handleOnChangeProbe(DEMO_LABELS.text, pack)}
          />
        </div>
      </section>

      <section className={`${styles.grid} ${styles.sectionGap}`}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>{DEMO_LABELS.controlled}</div>
          <ControlledSelect
            onChange={(option) =>
              handleOnChangeProbe(DEMO_LABELS.controlled, option)
            }
          />
        </div>
      </section>

      <header className={`${styles.header} ${styles.sectionGap}`}>
        <div className={styles.title}>Dialog (Compound) — 이중 API 데모</div>
      </header>

      <section className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>uncontrolled (modal)</div>
          <UncontrolledModal />
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>controlled (non-modal)</div>
          <div>- overlay가 없기 떄문에 스크롤을 잠그지 않는다</div>
          <ControlledNonModal />
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>asChild (modal)</div>
          <AsChildModal />
        </div>
      </section>
    </main>
  );
}
