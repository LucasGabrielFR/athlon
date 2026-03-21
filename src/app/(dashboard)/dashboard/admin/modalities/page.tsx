import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { modalities, positions, statTypes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import ModalitiesClient from './ModalitiesClient';

export default async function AdminModalitiesPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== 'admin') redirect('/dashboard');

  const allModalities = await db.select().from(modalities).orderBy(modalities.name);

  // Fetch positions & stats for each modality
  const allPositions = await db.select().from(positions);
  const allStats = await db.select().from(statTypes);

  const modalitiesWithPositions = allModalities.map((m) => ({
    ...m,
    positions: allPositions.filter((p) => p.modalityId === m.id),
    statTypes: allStats.filter((s) => s.modalityId === m.id),
  }));

  return <ModalitiesClient modalities={modalitiesWithPositions} />;
}
