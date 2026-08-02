import { useSelectContext } from '../hooks/useSelectContext';

export function Content() {
  const { open, items, getListboxProps, getOptionProps } = useSelectContext();

  if (!open) {
    return null;
  }

  return (
    <ul className="select-content" {...getListboxProps()}>
      {items.map((item) => (
        <li
          key={item.option.id}
          className={[
            'select-option',
            item.selected && 'select-option--selected',
            item.highlighted && 'select-option--highlighted',
            item.disabled && 'select-option--disabled',
          ]
            .filter(Boolean)
            .join(' ')}
          {...getOptionProps(item.index)}
        >
          {item.option.label}
        </li>
      ))}
    </ul>
  );
}
