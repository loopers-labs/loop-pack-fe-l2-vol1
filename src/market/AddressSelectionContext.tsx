import { createContext, useContext } from 'react';

interface AddressSelectionValue {
  onSelectAddress: (id: string) => void;
}

export const AddressSelectionContext =
  createContext<AddressSelectionValue | null>(null);

export function useAddressSelection() {
  const context = useContext(AddressSelectionContext);
  if (context === null) {
    throw new Error(
      'useAddressSelection must be used within an AddressSelectionContext.Provider',
    );
  }
  return context;
}
