export const PriceInput = ({
  price,
  onValueChange,
}: {
  price: number;
  onValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <input
      id="point"
      // type을 text로 변경하여 가격앞에 0이오는 경우를 방지
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      // value에도 toLocaleString()을 적용하여 가독성 향상
      value={price.toLocaleString()}
      onChange={onValueChange}
      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
        if (
          !/[0-9]/.test(e.key) &&
          !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)
        ) {
          e.preventDefault();
        }
      }}
    />
  );
};
