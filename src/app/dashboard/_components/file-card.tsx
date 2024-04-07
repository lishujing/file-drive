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
import { TrashIcon, MoreVertical, ImageIcon, FileTextIcon, GanttChartIcon, StarIcon, StarHalf } from 'lucide-react'
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
import { useMutation } from 'convex/react'
import { useToast } from '@/components/ui/use-toast'
import Image from 'next/image'
import { Protect } from "@clerk/nextjs";

function FileCardActions({ file, isFavorite }: { file: Doc<'files'>; isFavorite: boolean }) {
  const { toast } = useToast()
  const deleteFile = useMutation(api.files.deleteFile)
  const toggleFavorite = useMutation(api.files.toggleFavorite)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  return (
    <>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove your data from our
              servers.
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
                  title: 'File deleted',
                  description: 'Your file is now gone from the system',
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
          <Protect
            role="org:admin"
            permission="org:invoices:create"
            fallback={<></>}
          >
          <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex gap-1 text-red-600 items-center cursor-pointer"
              onClick={() => setIsConfirmOpen(true)}
            >
              <TrashIcon className="w-4 h-4" /> Delete
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
  const typeIcons = {
    image: <ImageIcon />,
    pdf: <FileTextIcon />,
    csv: <GanttChartIcon />,
  } as Record<Doc<'files'>['type'], ReactNode>

  const isFavorite = favorites.some((favorite) => favorite.fileId === file._id)

  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle className="flex gap-2 items-center">
          <div className="flex justify-center">{typeIcons[file.type]}</div>
          {file.name}
        </CardTitle>
        <div className="absolute top-2 right-2">
          <FileCardActions isFavorite={isFavorite} file={file} />
        </div>
      </CardHeader>
      <CardContent className="h-[200px] flex justify-center items-center">
        {file.type === 'image' && <Image alt={file.name} width="200" height="200" src={getFileUrl(file.fileId)} />}
        {file.type === 'csv' && <GanttChartIcon className="w-20 h-20" />}
        {file.type === 'pdf' && <FileTextIcon className="w-20 h-20" />}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={() => {
          // open a new tab to the file location on convex
          window.open(getFileUrl(file.fileId), "_blank");
        }}>Download</Button>
      </CardFooter>
    </Card>
  )
}
