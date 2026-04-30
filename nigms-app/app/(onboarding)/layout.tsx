import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import Logo from '@/components/Logo';
import OnboardingProgress from '@/components/OnboardingProgress';

/**
 * Onboarding layout — no navigation bar, shows step progress indicator.
 * Requirements: 2.1, 2.7
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // If onboarding is already complete, send them to the dashboard
  const { data: state } = await supabase
    .from('onboarding_states')
    .select('onboarding_complete, onboarding_step')
    .eq('user_id', session.user.id)
    .single();

  const typedState = state as { onboarding_complete: boolean; onboarding_step: string } | null;

  if (typedState?.onboarding_complete) {
    redirect('/dashboard');
  }

  // Determine current step from onboarding_step value
  const currentStep = typedState?.onboarding_step === 'assurance_upsell' ? 2 : 1;
  const totalSteps = 2;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#F4F5F7' }}
    >
      {/* Minimal branded header — no navigation */}
      <header className="flex flex-col items-center justify-center pt-8 pb-2 gap-4">
        <Logo size="md" />
        <OnboardingProgress currentStep={currentStep} totalSteps={totalSteps} />
      </header>

      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
