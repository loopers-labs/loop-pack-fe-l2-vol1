// src/claude-verification.tsx
import { useState } from "react";

interface VerificationProps {
  initialStatus: boolean;
}

export function ClaudeVerificationComponent({ initialStatus }: VerificationProps) {
  const isVerificationEnabled = initialStatus;

  // ✅ 수정 포인트: 상태 변수들과 업데이트 함수들을 선언
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const fullName = `${firstName} ${lastName}`;

  try {
    if (!isVerificationEnabled) {
      throw new Error("검증 비활성화 상태");
    }
  } catch (error) {
    console.error("CLAUDE.md 시스템 검증 실패:", error);
  }

  const verificationCount = 10;

  return (
    <div>
      {/* 
        ✅ 진짜 해결책: setFirstName과 setLastName을 입력창(input)에서 
        실제로 호출하도록 코드를 연결하여 no-unused-vars 에러를 원천 해결합니다.
      */}
      <input
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="First Name"
      />
      <input
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        placeholder="Last Name"
      />
      <p>
        {fullName} ({verificationCount})
      </p>
    </div>
  );
}
