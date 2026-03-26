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
            { text: 'Home', link: '/' },
            { text: 'Basic', link: '/basic-docs' }
        ],

        sidebar: {
            '/basic-docs/': [
                { text: 'Basic', items: await getSidebarItems('basic-docs') },

            ],
            '/project-docs/': [
                { text: 'Project', items: await getSidebarItems('project-docs') }
            ]
        },
        socialLinks: [
            { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
        ]
    }
})

async function getSidebarItems(mdPath: string, currentPath: string = ''): Promise<any[]> {
    const fullPath = currentPath ? `${mdPath}/${currentPath}` : mdPath

    let dirs = await globby('*', {
        cwd: `./${fullPath}`,
        onlyDirectories: true
    })
    dirs = dirs.filter(dir => dir !== 'node_modules')

    return await Promise.all(dirs.map(async (dir) => {
        const dirFullPath = `${fullPath}/${dir}`

        // 检查是否有子目录
        let subDirs = await globby('*', {
            cwd: `./${dirFullPath}`,
            onlyDirectories: true
        })
        subDirs = subDirs.filter(d => d !== 'node_modules')

        if (subDirs.length > 0) {
            // 有子目录，生成嵌套菜单
            return {
                text: dir,
                collapsed: false,
                items: await getSidebarItems(mdPath, `${currentPath}${currentPath ? '/' : ''}${dir}`)
            }
        } else {
            // 无子目录，直接链接
            return {
                text: dir,
                link: `${mdPath}/${currentPath}${currentPath ? '/' : ''}${dir}/readme`,
            }
        }
    }))
}
