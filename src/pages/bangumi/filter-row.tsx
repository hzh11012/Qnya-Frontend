import React from 'react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterRowProps {
  /** 筛选维度选项 */
  options: readonly FilterOption[];
  /** 当前选中值（'' 表示全部） */
  value: string;
  onChange: (value: string) => void;
}

/**
 * @title 单行筛选标签
 * @description 参考旧版番剧筛选页：横排标签，选中项主题色高亮
 */
const FilterRow: React.FC<FilterRowProps> = ({ options, value, onChange }) => (
  <div className='flex flex-wrap items-center gap-x-2 gap-y-1.5 select-none'>
    {options.map(option => {
      const active = value === option.value;
      return (
        <button
          key={option.label + option.value}
          type='button'
          className={cn(
            'text-sm px-3.5 py-1.5 rounded-sm cursor-pointer',
            'transition-colors duration-200 hover:text-primary',
            {
              'text-primary bg-primary/25': active
            }
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

FilterRow.displayName = 'FilterRow';

export default FilterRow;
