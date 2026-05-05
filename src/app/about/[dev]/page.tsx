export default async function AboutDevs({ params }: {
  params: Promise<{ dev: string }>
}) {
  const dev = (await params).dev
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve("delay")
    }, 2000)
  })
  return <div>{dev}</div>
}