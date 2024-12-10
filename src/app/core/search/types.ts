import { Mark } from "@/db/marks"
import { Article } from "@/stores/article"

export type SearchResult = Mark & Article & {
  searchType: string
}
