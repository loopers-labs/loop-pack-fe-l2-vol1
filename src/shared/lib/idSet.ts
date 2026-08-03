// id 집합을 다루는 순수 함수. 어떤 도메인의 id인지 모른다 — 그래서 shared에 둔다.
export type IdSet = Record<string, true>;

// 있으면 빼고 없으면 넣는다 — 원본을 건드리지 않고 새 객체를 만든다.
export const toggleId = (set: IdSet, id: string): IdSet => {
  const { [id]: existing, ...rest } = set;
  return existing === true ? rest : { ...set, [id]: true };
};

export const countIds = (set: IdSet): number => Object.keys(set).length;
