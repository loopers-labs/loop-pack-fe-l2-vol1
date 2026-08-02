'use client';

import { UncontrolledDialogExample } from './UncontrolledDialogExample';
import { ControlledDialogExample } from './ControlledDialogExample';
import styles from './dialog-example.module.css';

export function DialogExamples() {
  return (
    <div className={styles.exampleRow}>
      <UncontrolledDialogExample />
      <ControlledDialogExample />
    </div>
  );
}
