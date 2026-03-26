<!-- .vitepress/theme/components/SubDirList.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useData } from 'vitepress'

const props = defineProps({
  dirPath: {
    type: String,
    required: true
  }
})

const subDirs = ref([])

// VitePress 中无法直接扫描文件系统，需要在构建时生成数据
// 这里使用预定义的数据或通过 import.meta.glob 导入
const dirData = import.meta.glob(`/project-docs/**/readme.md`, { as: 'raw' })
onMounted(() => {
  // 处理目录数据，提取子目录列表
  const currentPath = props.dirPath
  const allPaths = Object.keys(dirData)
  
  subDirs.value = allPaths
    .filter(p => p.startsWith(currentPath) && p !== currentPath)
    .map(p => ({
      name: p.replace(currentPath, '').split('/')[1],
      path: '/rust-learning'+p.replace('/readme.md', '/readme'),
    }))
    .filter((v, i, a) => a.findIndex(t => t.path === v.path) === i)
})
</script>

<template>
  <div class="sub-dir-list">
    <ul>
      <li v-for="dir in subDirs" :key="dir.path">
        <a :href="dir.path">{{ dir.name }}</a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.sub-dir-list ul {
  list-style: none;
  padding: 0;
}
.sub-dir-list li {
  margin: 8px 0;
}
.sub-dir-list a {
  color: var(--vp-c-brand);
  text-decoration: none;
}
.sub-dir-list a:hover {
  text-decoration: underline;
}
</style>