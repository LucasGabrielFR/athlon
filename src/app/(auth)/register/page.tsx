import RegisterClient from './RegisterClient';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <RegisterClient error={error} />;
}
