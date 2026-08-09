'use client'

import { useId } from 'react'
import { useSelect } from '@/shared/ui/select'

interface ProductFilterOption {
  value: string
  label: string
}

interface ProductFilterSelectProps {
  label: string
  value: string
  options: ProductFilterOption[]
  onChange: (value: string) => void
}

export default function ProductFilterSelect({
  label,
  value,
  options,
  onChange,
}: ProductFilterSelectProps) {
  const labelId = useId()
  const valueId = useId()
  const selectedOption =
    options.find((option) => option.value === value) ?? null

  const handleOptionChange = (option: ProductFilterOption) => {
    onChange(option.value)
  }

  const {
    isOpen,
    highlightedIndex,
    getToggleProps,
    getOptionProps,
    getOptionState,
  } = useSelect({
    items: options,
    value: selectedOption,
    onChange: handleOptionChange,
    getItemId: (option) => option.value,
  })

  return (
    <div className="product-filter-control">
      <span id={labelId}>{label}</span>
      <div className="product-filter-select">
        <button
          {...getToggleProps()}
          className="product-filter-trigger"
          role="combobox"
          aria-controls={`${valueId}-listbox`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby={`${labelId} ${valueId}`}
          aria-activedescendant={
            isOpen && highlightedIndex >= 0
              ? `${valueId}-option-${highlightedIndex}`
              : undefined
          }
        >
          <span id={valueId}>{selectedOption?.label ?? 'Select'}</span>
          <span className="product-filter-chevron" aria-hidden="true" />
        </button>
        {isOpen ? (
          <ul
            id={`${valueId}-listbox`}
            className="product-filter-options"
            role="listbox"
            aria-labelledby={labelId}
          >
            {options.map((option, index) => {
              const optionState = getOptionState(index)

              return (
                <li
                  {...getOptionProps(index)}
                  id={`${valueId}-option-${index}`}
                  key={option.value}
                  className="product-filter-option"
                  role="option"
                  aria-selected={optionState.selected}
                  data-highlighted={optionState.highlighted || undefined}
                >
                  {option.label}
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
