import { redirect } from 'next/navigation';

export default async function ClubRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/clubs/${id}`);
}
