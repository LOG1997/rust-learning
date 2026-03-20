import { defineConfig } from 'vitepress'
import { globby } from 'globby'
// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Rust Learning Docs",
  description: "My Rust Learning Docs",
  base: '/rust-learning',
  outDir: './dist',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/rust-learning' },
      { text: 'Basic', link: '/rust-learning/basic-docs' }
    ],

    sidebar: 
    [
        { text: 'Basic', items: await getSidebarItems('basic-docs') }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
async function getSidebarItems(mdPath: string) {
// 扫描一级目录文件夹
  let dirs = await globby('*', { 
    cwd: `./${mdPath}`,
    onlyDirectories: true 
  })
  dirs=dirs.filter(dir => dir !== 'node_modules')
  // 生成侧边栏配置
  return dirs.map(dir => ({
    text: dir,  // 文件夹名称作为显示文本
    link: `/rust-learning/${mdPath}/${dir}/readme`,
  }))

}

