/**
 * SVGO 配置：优化 src/assets 下的插画/Logo SVG（pnpm svgo）。
 * 关键约束：fill 色依赖 style 属性里的 CSS 变量（var(--color-primary) 等）做主题适配，
 * presentation attribute（fill="…"）不支持 var()，必须禁用 inlineStyles 防止 svgo
 * 把 style 折叠成属性后主题色失效。
 */
export default {
  multipass: true,
  js2svg: {
    indent: 0,
    pretty: false
  },
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // 保留 style 属性：fill: var(--color-primary) 等主题变量写法不可折叠为属性
          inlineStyles: { active: false },
          // 坐标精度 2 位：viewBox 180x70 / 24x24 级别下视觉无损，体积减半
          convertPathData: {
            floatPrecision: 2,
            transformPrecision: 2
          }
        }
      }
    }
  ]
};
