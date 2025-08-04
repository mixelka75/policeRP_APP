// src/components/filters/DateRangeFilter.tsx
import React from 'react';
import { Input } from '@/components/ui';

interface DateRangeFilterProps {
  startValue?: string;
  endValue?: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  label?: string;
  startLabel?: string;
  endLabel?: string;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startValue = '',
  endValue = '',
  onStartChange,
  onEndChange,
  label = 'Период',
  startLabel = 'От',
  endLabel = 'До',
}) => {
  return (
    <div>
      <h3 className="text-sm font-medium text-white mb-3">{label}</h3>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={startLabel}
          type="date"
          value={startValue}
          onChange={(e) => onStartChange(e.target.value)}
          fullWidth
        />
        <Input
          label={endLabel}
          type="date"
          value={endValue}
          onChange={(e) => onEndChange(e.target.value)}
          fullWidth
        />
      </div>
    </div>
  );
};

export default DateRangeFilter;