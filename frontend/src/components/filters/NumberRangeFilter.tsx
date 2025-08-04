// src/components/filters/NumberRangeFilter.tsx
import React from 'react';
import { Input } from '@/components/ui';

interface NumberRangeFilterProps {
  minValue?: number;
  maxValue?: number;
  onMinChange: (value: number | undefined) => void;
  onMaxChange: (value: number | undefined) => void;
  label: string;
  minLabel?: string;
  maxLabel?: string;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  unit?: string;
}

const NumberRangeFilter: React.FC<NumberRangeFilterProps> = ({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  label,
  minLabel = 'От',
  maxLabel = 'До',
  minPlaceholder = '0',
  maxPlaceholder = '999999',
  unit = '',
}) => {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onMinChange(value ? parseInt(value) : undefined);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onMaxChange(value ? parseInt(value) : undefined);
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-white mb-3">{label}</h3>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={`${minLabel}${unit ? ` (${unit})` : ''}`}
          type="number"
          value={minValue?.toString() || ''}
          onChange={handleMinChange}
          placeholder={minPlaceholder}
          fullWidth
        />
        <Input
          label={`${maxLabel}${unit ? ` (${unit})` : ''}`}
          type="number"
          value={maxValue?.toString() || ''}
          onChange={handleMaxChange}
          placeholder={maxPlaceholder}
          fullWidth
        />
      </div>
    </div>
  );
};

export default NumberRangeFilter;