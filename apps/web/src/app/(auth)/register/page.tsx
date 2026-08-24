import RegisterClient from './RegisterClient';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="w-full max-w-md mx-auto">
      <RegisterClient error={error} />
    </div>
  );
}
