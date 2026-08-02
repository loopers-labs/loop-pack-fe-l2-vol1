interface PositiveIntegerOptions {
  max?: number
}

// 값뿐 아니라 표기까지 검증한다. Number()만 쓰면 '0x10', ' 1', '1e2'가
// 통과하고, 선행 0을 허용하면 같은 값을 여러 URL로 표현할 수 있다.
export const parsePositiveInteger = (
  raw: string,
  { max = Number.MAX_SAFE_INTEGER }: PositiveIntegerOptions = {},
) => {
  if (!/^[1-9]\d*$/.test(raw)) return null

  const value = Number(raw)

  return Number.isSafeInteger(value) && value <= max ? value : null
}
