import { Tag } from "@/api/tags-api"

import http from "@/api/http-client"

export enum TaggableTypes {
  DATASET = "Dataset", //
  // OTHER_MODEL = 'OtherModel'
}

export type Tagging = {
  id: number
  tagId: Tag["id"]
  taggableId: number
  taggableType: TaggableTypes
  createdAt: string
  updatedAt: string

  // associations
  tag?: Tag
}

export const taggingsApi = {
  async list({
    where,
    page,
    perPage,
  }: {
    where?: Record<string, unknown> // TODO: consider adding Sequelize types to front-end?
    page?: number
    perPage?: number
  } = {}): Promise<{
    taggings: Tagging[]
    totalCount: number
  }> {
    const { data } = await http.get("/api/taggings", {
      params: { where, page, perPage },
    })
    return data
  },
}

export default taggingsApi
