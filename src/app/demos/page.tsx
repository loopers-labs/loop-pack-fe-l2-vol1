import { DialogDemo } from './DialogDemo';
import { SelectDemo } from './SelectDemo';

export default function DemosPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-extrabold">Commerce UI Kit</h1>
      <p className="mt-2 mb-12 text-[#5a6675]">Select · Dialog 데모</p>
      <SelectDemo />
      <div className="mt-16">
        <DialogDemo />
      </div>
    </main>
  );
}
