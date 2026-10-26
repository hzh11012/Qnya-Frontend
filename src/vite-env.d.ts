/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

// hls.js 的 light 构建（不含字幕/多音轨/EME，其余 API 一致）未随包发布类型声明，
// 复用主入口的类型；播放器只用 levels 切换档位，不涉及被裁剪的能力
declare module 'hls.js/light' {
  import Hls from 'hls.js';
  export default Hls;
}
