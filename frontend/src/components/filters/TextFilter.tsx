// src/components/filters/TextFilter.tsx
import React from 'react';
import { Input } from '@/components/ui';

interface TextFilterProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
}

const TextFilter: React.FC<TextFilterProps> = ({
  value,
  onChange,
  label,
  placeholder = '',
}) => {
  return (
    <div>
      <h3 className="text-sm font-medium text-white mb-3">{label}</h3>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        fullWidth
      />
    </div>
  );
};

export default TextFilter;