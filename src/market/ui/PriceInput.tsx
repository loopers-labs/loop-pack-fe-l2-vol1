export const PriceInput = ({
  price,
  callback,
}: {
  price: number;
  callback: (value: number) => void;
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
      onChange={(e) => {
        const value = parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
        callback(value);
      }}
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
