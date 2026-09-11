'use client'

type LogoutButtonProps = {
  onClick: () => void
  isPending: boolean
}

export const LogoutButton = ({ onClick, isPending }: LogoutButtonProps) => (
  <button type="button" onClick={onClick} disabled={isPending}>
    로그아웃
  </button>
)
