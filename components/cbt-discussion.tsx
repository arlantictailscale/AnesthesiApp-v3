"use client"

import { CommunityDiscussion } from "@/components/community-discussion"
import {
  ratePackage,
  getPackageRatings,
  addComment,
  getPackageComments,
} from "@/lib/cbt/storage"

interface CBTDiscussionProps {
  packageId: string
  packageName: string
}

export function CBTDiscussion({ packageId }: CBTDiscussionProps) {
  return (
    <CommunityDiscussion
      entityId={packageId}
      loginPrompt="Silakan login untuk bergabung dalam ruang diskusi paket soal ini."
      rate={ratePackage}
      getRatings={getPackageRatings}
      addComment={addComment}
      getComments={getPackageComments}
    />
  )
}
