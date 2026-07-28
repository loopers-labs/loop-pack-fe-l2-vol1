'use client';

import { ControlledDialogDemo } from '../components/ui/dialog/components/controlled-demo';
import { UncontrolledDialogDemo } from '../components/ui/dialog/components/uncontrolled-demo';
import { BundleSelectDemo } from '../components/ui/select/components/bundle-demo';
import { ProductSelectDemo } from '../components/ui/select/components/product-demo';
import { SizeSelectDemo } from '../components/ui/select/components/size-demo';

const Demo = () => {
  return (
    <div className="flex flex-col items-center gap-6 mt-6">
      <SizeSelectDemo />
      <ProductSelectDemo />
      <BundleSelectDemo />
      <UncontrolledDialogDemo />
      <ControlledDialogDemo />
    </div>
  );
};

export default Demo;
