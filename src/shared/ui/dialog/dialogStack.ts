// 열린 Dialog의 순서를 기록하는 모듈 스택.
const openDialogs: symbol[] = [];

export function pushDialog(dialogToken: symbol) {
  openDialogs.push(dialogToken);
}

export function popDialog(dialogToken: symbol) {
  const index = openDialogs.lastIndexOf(dialogToken);

  if (index >= 0) {
    openDialogs.splice(index, 1);
  }
}

export function isTopDialog(dialogToken: symbol) {
  return openDialogs.at(-1) === dialogToken;
}
