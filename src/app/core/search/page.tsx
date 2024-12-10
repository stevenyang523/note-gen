'use client'
import { Input } from "@/components/ui/input";
import useMarkStore from "@/stores/mark";
import { useEffect, useState } from "react";
import Fuse, { FuseResult } from "fuse.js";
import useArticleStore from "@/stores/article";
import { SearchResult } from './types'
import { SearchItem } from "./search-item";
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import zh from 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale(zh)

const searchList: Partial<SearchResult>[] = []
export default function Page() {
  const [searchValue, setSearchValue] = useState('')
  const { fetchAllMarks, allMarks } = useMarkStore()
  const [searchResult, setSearchResult] = useState<FuseResult<Partial<SearchResult>>[]>([])
  const { allArticle, loadAllArticle } = useArticleStore()

  function search(value: string) {
    const fuse = new Fuse(searchList, {
      keys: ['desc', 'article'],
      includeMatches: true,
      includeScore: true,
      threshold: 0.3,
    })
    const res = fuse.search(value).reverse()
    setSearchResult(res)
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchValue(e.target.value)
    search(e.target.value)
  }
  async function initSearch() {
    await fetchAllMarks()
    await loadAllArticle()
  }

  function setSearchData() {
    const marks = allMarks.map(item => ({...item, searchType: 'mark'}))
    searchList.push(...marks)
    const articles = allArticle.map(item => ({...item, searchType: 'article'}))
    searchList.push(...articles)
  }

  useEffect(() => {
    initSearch()
  }, [])

  useEffect(() => {
    searchList.length = 0
    setSearchData()
  }, [allArticle, allMarks])

  return <div className="h-screen flex flex-col justify-center items-center overflow-y-auto">
    <div className="w-full">
      <Input
        type="text"
        
        value={searchValue}
        onChange={(e) => handleSearch(e)}
        className="w-[560px] mx-auto my-4"
        placeholder="搜索笔记和文章..."
      />
    </div>
    {
      searchResult.length > 0 ?
      <div className="flex-1 w-full">
        {
          searchResult.map((item: FuseResult<Partial<SearchResult>>) => {
            return <SearchItem key={item.refIndex} item={item} />
          })
        }
      </div>: null
    }
  </div>
}