import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Doc, Id } from '../../../../convex/_generated/dataModel'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileIcon, UndoIcon, TrashIcon, MoreVertical, ImageIcon, FileTextIcon, GanttChartIcon, StarIcon, StarHalf } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ReactNode, useState } from 'react'
import { api } from '../../../../convex/_generated/api'
import { useMutation, useQuery } from 'convex/react'
import { useToast } from '@/components/ui/use-toast'
import Image from 'next/image'
import { Protect } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format, formatDistance, formatRelative, subDays } from 'date-fns'

function FileCardActions({ file, isFavorite }: { file: Doc<'files'>; isFavorite: boolean }) {
  const { toast } = useToast()
  const deleteFile = useMutation(api.files.deleteFile)
  const restoreFile = useMutation(api.files.restoreFile)
  const toggleFavorite = useMutation(api.files.toggleFavorite)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  return (
    <>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark the file for our deletion process. Files are deleted periodically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                // TODO: actually delete the file
                await deleteFile({
                  fileId: file._id,
                })

                toast({
                  variant: 'default',
                  title: 'File marked for deletion',
                  description: 'Your file will be deleted soon',
                })
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <MoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            className="flex gap-1 items-center cursor-pointer"
            onClick={() => {
              toggleFavorite({
                fileId: file._id
              })
            }}
          >
            {isFavorite ? (
              <div className='flex gap-1 items-center'>
                <StarIcon className="w-4 h-4" /> Unfavorite
              </div>
            ) : (
              <div className='flex gap-1 items-center'>
                <StarHalf className="w-4 h-4" /> Favorite
              </div>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex gap-1 items-center cursor-pointer"
            onClick={() => {
              // open a new tab to the file location on convex
              window.open(getFileUrl(file.fileId), "_blank");
            }}
          >
            <FileIcon className="w-4 h-4" /> Download
          </DropdownMenuItem>

          <Protect
            role="org:admin"
            fallback={<></>}
          >
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex gap-1 items-center cursor-pointer"
              onClick={() => {
                if (file.shouldDelete) {
                  restoreFile({
                    fileId: file._id
                  })
                } else {
                  setIsConfirmOpen(true)
                }
              }}
            >
              {file.shouldDelete ? (
                <div className='flex gap-1 text-green-600 items-center cursor-pointer'>
                  <UndoIcon className="w-4 h-4" /> Restore
                </div>
              ) : (
                <div className='flex gap-1 text-red-600 items-center cursor-pointer'>
                  <TrashIcon className="w-4 h-4" /> Delete
                </div>
              )}

            </DropdownMenuItem>
          </Protect>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

function getFileUrl(fileId: Id<"_storage">): string {
  return `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${fileId}`
}

export function FileCard({ file, favorites }: { file: Doc<'files'>; favorites: Doc<"favorites">[] }) {

  const userProfile = useQuery(api.users.getUserProfile, {
    userId: file.userId
  })

  const typeIcons = {
    image: <ImageIcon />,
    jpeg: <ImageIcon />,
    pdf: <FileTextIcon />,
    csv: <GanttChartIcon />,
  } as Record<Doc<'files'>['type'], ReactNode>

  const isFavorite = favorites.some((favorite) => favorite.fileId === file._id)

  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle className="flex gap-2 items-center text-base font-normal">
          <div className="flex justify-center">{typeIcons[file.type]}</div>
          {file.name}
        </CardTitle>
        <div className="absolute top-2 right-2">
          <FileCardActions isFavorite={isFavorite} file={file} />
        </div>
      </CardHeader>
      <CardContent className="h-[200px] flex justify-center items-center">
        {(file.type === 'image' || file.type === 'jpeg') && <Image alt={file.name} width="200" height="200" src={getFileUrl(file.fileId)} />}
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
