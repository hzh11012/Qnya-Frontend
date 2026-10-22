import { useEffect } from 'react';
import { useSettings } from '@/lib/settings';

/** 将设备级设置应用到文档根（字体等非主题类的全局样式） */
const SettingsStyle = () => {
  const { fontFamily } = useSettings();

  useEffect(() => {
    // '' 为站点默认字体栈，清空内联样式即可回落
    document.documentElement.style.fontFamily = fontFamily;
  }, [fontFamily]);

  return null;
};

export default SettingsStyle;
