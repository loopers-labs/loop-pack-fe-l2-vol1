// docs/images/select1.png 구현 (uncontrolled 데모)

import { useSelect } from "../useSelect";
import { SizeSelectView } from "./SizeSelectView";
import { SIZE_OPTIONS, type SizeOption } from "./sampleData";

const sizeToKey = (option: SizeOption) => option.id;
const isSizeSoldOut = (option: SizeOption) => option.soldOut;

export function SizeSelect({
  onChange,
}: {
  onChange?: (option: SizeOption) => void;
}) {
  const select = useSelect<SizeOption>({
    options: SIZE_OPTIONS,
    optionToKey: sizeToKey,
    isOptionDisabled: isSizeSoldOut,
    onChange,
  });

  return <SizeSelectView {...select} />;
}
