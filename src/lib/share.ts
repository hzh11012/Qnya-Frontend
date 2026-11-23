/**
 * 分享 / 邀请文案的组装与复制。
 *
 * 原来只往剪贴板里塞一个 URL，粘到微信 / QQ 对话框里就是一串裸地址，
 * 对方看不出点进去是什么。改成「推荐语 + 链接」两行：链接固定放最后一行
 * （客户端靠它生成可点卡片），前面一句说清分享的是什么。
 */
export interface ShareInfo {
  /** 首行推荐语：一句话说清分享的是什么 */
  title: string;
  /** 可选补充行，如私人放映室的密码提示 */
  note?: string;
  /** 复制成功后的提示语：分享和邀请的口径不同，由调用场景给 */
  successText?: string;
}

/** 拼装「推荐语 + 链接」：空字段跳过，链接固定放最后一行 */
export const buildShareText = ({ title, note }: ShareInfo, url: string) =>
  [title, note, url].filter(Boolean).join('\n');

/**
 * 复制分享文案到剪贴板。
 *
 * 非 HTTPS 环境（内网 IP 直访）下 `navigator.clipboard` 不存在或抛错，
 * 由调用方提示手动复制地址栏。
 *
 * @returns 是否复制成功
 */
export const copyShareText = async (
  info: ShareInfo,
  url: string = window.location.href
) => {
  try {
    await navigator.clipboard.writeText(buildShareText(info, url));
    return true;
  } catch {
    return false;
  }
};
