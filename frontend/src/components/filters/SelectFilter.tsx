// src/components/filters/SelectFilter.tsx
import React from 'react';
import { Select } from '@/components/ui';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label: string;
  placeholder?: string;
}

const SelectFilter: React.FC<SelectFilterProps> = ({
  value,
  onChange,
  options,
  label,
  placeholder = 'Выберите...',
}) => {
  return (
    <div>
      <h3 className="text-sm font-medium text-white mb-3">{label}</h3>
      <Select
        options={options}
        value={value}
        onChange={onChange}
        fullWidth
      />
    </div>
  );
};

export default SelectFilter;