import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Doc } from '../../../../convex/_generated/dataModel'
import {ImageIcon, FileTextIcon, GanttChartIcon } from 'lucide-react'
import { ReactNode } from 'react'
import { api } from '../../../../convex/_generated/api'
import { useQuery } from 'convex/react'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatRelative } from 'date-fns'
import { FileCardActions } from './file-actions'

export function FileCard({ file }: { file: Doc<'files'> & {isFavorited: boolean; url: string | null }}) {
  const userProfile = useQuery(api.users.getUserProfile, {
    userId: file.userId
  })

  const typeIcons = {
    image: <ImageIcon />,
    jpeg: <ImageIcon />,
    pdf: <FileTextIcon />,
    csv: <GanttChartIcon />,
  } as Record<Doc<'files'>['type'], ReactNode>

  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle className="flex gap-2 items-center text-base font-normal">
          <div className="flex justify-center">{typeIcons[file.type]}</div>
          {file.name}
        </CardTitle>
        <div className="absolute top-2 right-2">
          <FileCardActions isFavorite={file.isFavorited} file={file} />
        </div>
      </CardHeader>
      <CardContent className="h-[200px] flex justify-center items-center">
        {(file.type === 'image' || file.type === 'jpeg') && file.url && (<Image alt={file.name} width="200" height="200" src={file.url} />)}
        {file.type === 'csv' && <GanttChartIcon className="w-20 h-20" />}
        {file.type === 'pdf' && <FileTextIcon className="w-20 h-20" />}
      </CardContent>
      <CardFooter className="flex justify-between text-gray-700">
        <div className="flex gap-2 text-xs w-40 items-center">
          <Avatar className="w-6 h-6">
            <AvatarImage src={userProfile?.image} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          {userProfile?.name}
        </div>
        <div className="text-xs">
          Uploaded on {formatRelative(new Date(file._creationTime), new Date())}
        </div>
      </CardFooter>
    </Card>
  )
}
