/** 从键盘事件归一化出组合键串（修饰键 + e.code），无修饰键返回 '' */
export const comboFromEvent = (e: KeyboardEvent) => {
  const mods: string[] = [];
  if (e.ctrlKey) mods.push('ctrl');
  if (e.altKey) mods.push('alt');
  if (e.shiftKey) mods.push('shift');
  return mods.length ? `${mods.join('+')}+${e.code}` : '';
};
