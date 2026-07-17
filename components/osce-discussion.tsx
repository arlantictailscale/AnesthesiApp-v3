"use client"

import { CommunityDiscussion } from "@/components/community-discussion"
import {
  rateStation,
  getStationRatings,
  addStationComment,
  getStationComments,
} from "@/lib/osce/storage"

interface OSCEDiscussionProps {
  stationId: string
  stationTitle: string
}

export function OSCEDiscussion({ stationId }: OSCEDiscussionProps) {
  return (
    <CommunityDiscussion
      entityId={stationId}
      loginPrompt="Silakan login untuk bergabung dalam ruang diskusi stasiun ini."
      rate={rateStation}
      getRatings={getStationRatings}
      addComment={addStationComment}
      getComments={getStationComments}
    />
  )
}
