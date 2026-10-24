import { useEffect } from 'react';

const SITE_NAME = 'Qnya';

/**
 * 页面标题：各路由页面自行声明（支持播放页番名、搜索关键字等动态值），
 * 依赖变化即时更新，卸载时回落站点名，避免上个页面的动态标题残留
 */
export const useDocumentTitle = (title: string | null | undefined) => {
  useEffect(() => {
    document.title = title ? `${title} - ${SITE_NAME}` : SITE_NAME;
    return () => {
      document.title = SITE_NAME;
    };
  }, [title]);
};
