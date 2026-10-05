declare module 'virtual:starlight-seo/options' {
  const options: Record<string, any>
  export default options
}

declare module 'virtual:starlight-seo/extend' {
  export const page: import('./index.js').SeoPageHook | undefined
  export const graph: import('./index.js').SeoGraphHook | undefined
}
