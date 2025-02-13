import { DirTree } from "@/stores/article"

// 计算父目录路径
export function computedParentPath(item: DirTree) {
  let path = item.name
  function readParentPath(item: DirTree) {
    if (item.parent) {
      path = item.parent.name + '/' + path
      if (item.parent.parent) {
        readParentPath(item.parent)
      }
    }
  }
  readParentPath(item)
  return path
}