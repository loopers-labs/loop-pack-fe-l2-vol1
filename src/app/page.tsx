import { DialogDemos } from './_components/DialogDemos.client'
import { SelectDemos } from './_components/SelectDemos.client'

const codeClassName =
  'inline-flex rounded bg-[#f4f3ec] px-2 py-1 font-mono text-[15px] leading-[1.35] text-[#08060d]'

export default function Home() {
  return (
    <main className="mx-auto max-w-160 px-6 py-16">
      <h1 className="mb-3 text-[28px] font-extrabold text-[#08060d]">
        Commerce
      </h1>
      <p className="mb-6 leading-[1.7] break-keep text-[#5a6675]">
        4주차부터 여기에 커머스를 쌓아갑니다. 이번 주는 디자인 시스템의 뼈대{' '}
        <b>Select</b>와 <b>Dialog</b>를 직접 만드는 것부터 시작해요.
      </p>
      <ul className="pl-4.5 leading-8 text-[#18212e]">
        <li>
          Select 자리:{' '}
          <code className={codeClassName}>src/shared/ui/select</code>
          <SelectDemos />
        </li>
        <li>
          Dialog 자리:{' '}
          <code className={codeClassName}>src/shared/ui/dialog</code>
          <DialogDemos />
        </li>
        <li>
          과제 명세:{' '}
          <code className={codeClassName}>docs/assignments/week-04.md</code>
        </li>
      </ul>
      <p className="mt-6 text-sm text-[#8794a3]">
        구조는 최소 골격만 있어요. 폴더 구성은 각자 근거를 대고 바꾸면 돼요.
      </p>
    </main>
  )
}
