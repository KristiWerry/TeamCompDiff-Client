export function generateStaticParams() {
  return [];
}

export default async function AboutDevs({ params }: {
  params: Promise<{ dev: string }>
}) {
  const dev = (await params).dev
  return <div>{dev}</div>
}