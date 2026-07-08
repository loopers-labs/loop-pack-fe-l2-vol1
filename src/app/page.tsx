import { SelectExamples } from "./SelectExamples";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F5F5F6] text-[#191919]">
      <div className="border-b border-[#E1E1E1] bg-white">
        <div className="mx-auto flex max-w-[1040px] items-baseline gap-2.5 px-5 py-[18px] pb-4">
          <div className="text-xl font-extrabold tracking-[-0.02em]">
            마켓<span className="text-[#00C73C]">나우</span>
          </div>
          <div className="text-xs text-[#767676]">useSelect 구현 과제 예시 화면</div>
        </div>
      </div>

      <div className="mx-auto max-w-[1040px] px-5 pt-4 text-[13px] text-[#767676]">
        홈 &nbsp;›&nbsp; 베이커리 &nbsp;›&nbsp;{" "}
        <b className="font-semibold text-[#191919]">베이글 전체</b>
      </div>

      <div className="mx-auto max-w-[1040px] px-5 pb-16 pt-3">
        <div className="mb-5 flex flex-wrap gap-2 text-xs text-[#767676]">
          <code className="rounded-md border border-[#E1E1E1] bg-white px-2.5 py-1">
            src/components/ui/select
          </code>
          <code className="rounded-md border border-[#E1E1E1] bg-white px-2.5 py-1">
            GET /api/products
          </code>
          <code className="rounded-md border border-[#E1E1E1] bg-white px-2.5 py-1">
            docs/assignments/week-04.md
          </code>
        </div>
        <div>
          <SelectExamples />
        </div>
      </div>
    </main>
  );
}
