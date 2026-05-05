
export default function DashboardLayout({
  children,
  notifications
}: {
  children: React.ReactNode,
  notifications: React.ReactNode
}) {
  return (
    <>
      <div>{children}</div>
      <div>{notifications}</div>
    </>
  )
}