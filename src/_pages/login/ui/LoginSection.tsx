"use client";

import { LoginForm } from "@/features/auth";
import layout from "@/shared/ui/layout.module.css";

export function LoginSection() {
  return (
    <section className={layout.section}>
      <h1 className={layout.sectionTitle}>로그인</h1>
      <LoginForm />
    </section>
  );
}
