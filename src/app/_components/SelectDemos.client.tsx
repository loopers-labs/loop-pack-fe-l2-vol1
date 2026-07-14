'use client'

import { For } from '@ilokesto/utilinent'
import { type ReactNode, useState } from 'react'

import { SelectContent } from '@/shared/ui/select/components/SelectContent'
import { SelectItem } from '@/shared/ui/select/components/SelectItem'
import { SelectRoot } from '@/shared/ui/select/components/SelectRoot'
import { SelectTrigger } from '@/shared/ui/select/components/SelectTrigger'
import { SelectValue } from '@/shared/ui/select/components/SelectValue'
import type {
  SelectOption,
  SelectOptionRenderState,
} from '@/shared/ui/select/types'

import {
  productOptions,
  sizeOptions,
  textOptions,
} from './select-demos/options'
import {
  renderProductOption,
  renderProductValue,
  renderSizeOption,
  renderSizeValue,
  renderTextOption,
  renderTextValue,
} from './select-demos/renderers'
import { contentClassName, triggerClassName } from './select-demos/styles'
import type {
  ProductSelectOption,
  SizeSelectOption,
  TextSelectOption,
} from './select-demos/types'

type DemoPanelProps = {
  readonly children: ReactNode
  readonly description: string
  readonly title: string
}

type SelectDemoProps<TOption extends SelectOption> = Omit<
  DemoPanelProps,
  'children'
> & {
  readonly ariaLabel: string
  readonly onChange: (option: TOption) => void
  readonly options: ReadonlyArray<TOption>
  readonly renderOption: (state: SelectOptionRenderState<TOption>) => ReactNode
  readonly renderValue: (option: TOption) => ReactNode
  readonly value: TOption
}

function DemoPanel({ children, description, title }: DemoPanelProps) {
  return (
    <article className="rounded-2xl border border-[#d8d2c3] bg-[#fbfaf3] p-4 shadow-sm">
      <h3 className="text-sm font-bold text-[#08060d]">{title}</h3>
      <p className="mt-1 min-h-10 text-xs leading-5 break-keep text-[#5a6675]">
        {description}
      </p>
      <div className="mt-4">{children}</div>
    </article>
  )
}

function TriggerIndicator() {
  return (
    <svg
      aria-hidden="true"
      className="size-4 shrink-0 text-[#8794a3]"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function SelectDemo<TOption extends SelectOption>({
  ariaLabel,
  description,
  onChange,
  options,
  renderOption,
  renderValue,
  title,
  value,
}: SelectDemoProps<TOption>) {
  return (
    <DemoPanel title={title} description={description}>
      <SelectRoot<TOption> options={options} value={value} onChange={onChange}>
        <SelectTrigger aria-label={ariaLabel} className={triggerClassName}>
          <SelectValue>{() => renderValue(value)}</SelectValue>
          <TriggerIndicator />
        </SelectTrigger>
        <SelectContent className={contentClassName}>
          <For each={[...options]}>
            {(option) => (
              <SelectItem key={option.id} option={option}>
                {renderOption}
              </SelectItem>
            )}
          </For>
        </SelectContent>
      </SelectRoot>
    </DemoPanel>
  )
}

export function SelectDemos() {
  const [selectedTextOption, setSelectedTextOption] =
    useState<TextSelectOption>(textOptions[0])
  const [selectedSizeOption, setSelectedSizeOption] =
    useState<SizeSelectOption>(sizeOptions[1])
  const [selectedProductOption, setSelectedProductOption] =
    useState<ProductSelectOption>(productOptions[0])

  return (
    <section
      aria-labelledby="select-demos-title"
      className="mt-4 rounded-3xl border border-[#e4dece] bg-[#f8f7f0] p-4 leading-normal shadow-sm"
    >
      <div className="mb-4">
        <h2
          id="select-demos-title"
          className="text-base font-bold text-[#08060d]"
        >
          Select 예시
        </h2>
        <p className="mt-1 text-sm leading-6 break-keep text-[#5a6675]">
          같은 headless API로 텍스트, 사이즈, 상품형 옵션을 렌더링합니다.
        </p>
      </div>
      <div className="grid gap-4">
        <SelectDemo
          ariaLabel="문구 옵션 선택"
          title="Text option"
          description="선택, 하이라이트, 비활성 상태를 문구 설명과 함께 확인합니다."
          options={textOptions}
          value={selectedTextOption}
          onChange={setSelectedTextOption}
          renderValue={renderTextValue}
          renderOption={renderTextOption}
        />
        <SelectDemo
          ariaLabel="사이즈 옵션 선택"
          title="Size option"
          description="전체 옵션 객체를 상태로 보관해 선택된 사이즈의 핏 정보를 표시합니다."
          options={sizeOptions}
          value={selectedSizeOption}
          onChange={setSelectedSizeOption}
          renderValue={renderSizeValue}
          renderOption={renderSizeOption}
        />
        <SelectDemo
          ariaLabel="상품 옵션 선택"
          title="Product option"
          description="장식 썸네일과 가격, 배송 메모를 가진 상품형 옵션을 보여줍니다."
          options={productOptions}
          value={selectedProductOption}
          onChange={setSelectedProductOption}
          renderValue={renderProductValue}
          renderOption={renderProductOption}
        />
      </div>
    </section>
  )
}
