import React from 'react';
import Exception from '@/components/custom/exception';

/**
 * 列表空态：保留页标题，插画在标题以下的剩余区域居中。
 * 各列表页此前各写一份同样的 flex 容器，统一收在这里。
 */
const ListEmpty: React.FC = () => (
  <div className='flex min-h-60 flex-1 items-center justify-center md:min-h-75'>
    <Exception type='empty' />
  </div>
);

export default ListEmpty;
