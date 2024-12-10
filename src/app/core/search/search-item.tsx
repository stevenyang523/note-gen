import { FuseResult, RangeTuple } from 'fuse.js'
import { SearchResult } from './types'
import { LocalImage } from '@/components/local-image'
import { LocateFixed } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MarkType } from '@/db/marks'
import dayjs from 'dayjs'
import useTagStore from '@/stores/tag'
import { useRouter } from 'next/navigation'
import useArticleStore from '@/stores/article'

function highlightMatches(inputString: string, matches: readonly RangeTuple[]): string[] {
  const highlightedStringArray: string[] = [];
  let lastIndex = 0;
  for (const match of matches) {
    const startIndex = match[0];
    const endIndex = match[1];
    highlightedStringArray.push(inputString.slice(lastIndex, startIndex));
    highlightedStringArray.push(`<span class="search-highlight">${inputString.slice(startIndex, endIndex + 1)}</span>`);
    lastIndex = endIndex + 1;
  }
  highlightedStringArray.push(inputString.slice(lastIndex));
  return highlightedStringArray;
}

function SearchMark({
  item,
}: {
  item: FuseResult<Partial<SearchResult>>
}) {
  const path = item.item?.type === 'scan' ? 'screenshot' : 'image'

  return (
    <div className="flex gap-4 w-full justify-between">
      <div className='flex flex-col justify-between'>
        <div className='flex gap-1 mb-2 items-center'>
          <RouteTo item={item} />
          <Badge variant={'secondary'}>{MarkType[item.item.type || 'scan']}</Badge>
          <Badge variant={'secondary'}>{dayjs(item.item.createdAt).fromNow()}</Badge>
          <Badge variant={'secondary'}>{item.matches?.[0].indices.length}个匹配项</Badge>
        </div>
        <p className='text-sm line-clamp-1' dangerouslySetInnerHTML={
          {__html: highlightMatches(item.item?.desc || '', item.matches?.[0].indices || []).join('')}
        }>
        </p>
      </div>
      {
        item.item?.type === 'text' ? (
          null
        ) : (
          <LocalImage
            src={item.item?.url?.includes('http') ? item.item.url : `/${path}/${item.item.url}`}
            alt=""
            className="size-12 border object-cover"
          />
        )
      }
    </div>
  )
}

function SearchArticle({
  item,
}: {
  item: FuseResult<Partial<SearchResult>>
}) {
  const hightlightArticle = highlightMatches(item.item?.article || '', item.matches?.[0].indices || []).join('')

  return (
    <div className="flex gap-4 w-full">
      <div className='flex flex-col flex-1 justify-between'>
        <div className='flex gap-1 mb-2 items-center'>
          <RouteTo item={item} />
          <Badge variant={'secondary'}>文章</Badge>
          <Badge variant={'secondary'}>{item.item.path}</Badge>
          <Badge variant={'secondary'}>{item.matches?.[0].indices.length}个匹配项</Badge>
        </div>
        <div className='flex flex-col gap-1 flex-1'>
          {
            item.matches?.[0].indices.slice(0, 2).map((range, index) => {
              return <p key={index} className='text-sm line-clamp-1 overflow-hidden' dangerouslySetInnerHTML={{
                __html: hightlightArticle?.slice(Math.max(range[0] - 50 + index * 44, 0), range[1] + 180 + index * 44)
              }}>
              </p>
            })
          }
        </div>
      </div>
    </div>
  )
}

function SearchType({
  item,
}: {
  item: FuseResult<Partial<SearchResult>>
}) {

  switch (item.item.searchType) {
    case 'mark':
      return <SearchMark item={item} />
    default:
      return <SearchArticle item={item} />
  }
}

function RouteTo({
  item,
}: {
  item: FuseResult<Partial<SearchResult>>
}) {
  const { setCurrentTagId } = useTagStore()
  const { setActiveFilePath } = useArticleStore()
  const router = useRouter()
  function handleRouterTo() {
    switch (item.item.searchType) {
      case 'mark':
        setCurrentTagId(item.item.tagId as number)
        router.push(`/core/note`)
        break;
      default:
        setActiveFilePath(item.item.path as string)
        router.push(`/core/article`)
        break;
    }
  }
  return (
    <LocateFixed className='size-4 cursor-pointer mr-1 text-cyan-900' onClick={handleRouterTo} />
  )
}
export function SearchItem({
  item,
}: {
  item: FuseResult<Partial<SearchResult>>
}) {
  
  return (
    <div className="flex items-center justify-between px-2 py-2 border-b border-b-gray-200 dark:border-b-gray-700">
      <div className="flex items-center gap-2 w-full">
        <SearchType item={item} />
      </div>
    </div>
  ) 
}