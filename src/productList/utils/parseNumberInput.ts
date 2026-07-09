/**
 * number input의 raw 문자열을 값(number | '')으로 파싱한다.
 * - 분리기준: number 인풋의 값을 backspace로 모두 지울 때, 0이 남아 있어 url 상에서도 쿼리 파라미터 값이 0으로 남아있는 상황이 발생하여 분리한 순수함수입니다.
 * - 렌더링만 되는 코드에서 해당 조건문을 순수함수로 분리하였습니다.
 */
export const parseNumberInput = (raw: string): number | '' => (raw === '' ? '' : Number(raw));
