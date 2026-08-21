import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import ModalitiesClient from './ModalitiesClient';

export default async function AdminModalitiesPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== 'admin') redirect('/dashboard');

  let modalitiesWithPositions: any[] = [];
  try {
    modalitiesWithPositions = await fetchApi('/modalities/admin-list');
  } catch(e) {}

  return <ModalitiesClient modalities={modalitiesWithPositions} />;
}
