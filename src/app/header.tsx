import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";

export function Header() {
  return (
    <div className="border-b bg-gray-50 py-4">
      <div className="container mx-auto flex justify-between items-center">
        <div>FileDrive</div>
        <div className="flex gap-2">
          <OrganizationSwitcher />
          <UserButton />
        </div>
      </div>
    </div>
  )
}