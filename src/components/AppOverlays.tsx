import { lazy, Suspense, useState } from 'react';
import CanaryModal from './modals/CanaryModal';
import UserAlertsModal from './modals/UserAlertsModal';
import SurveyModal from './modals/SurveyModal';
import { useAuth } from '../hooks/auth/useAuth';
import { useActiveUpdateModal } from '../hooks/useActiveUpdateModal';
import { useUserAlerts } from '../hooks/useUserAlerts';
import { useActiveSurvey } from '../hooks/useActiveSurvey';

const UpdateOverviewModal = lazy(() => import('./modals/UpdateOverviewModal'));

export default function AppOverlays() {
  const { user } = useAuth();
  const { activeModal, showUpdateModal, handleCloseModal } =
    useActiveUpdateModal(user);
  const { alerts, dismiss } = useUserAlerts(user);
  const { survey, markSubmitted } = useActiveSurvey(user);
  const [canaryOpen, setCanaryOpen] = useState(false);

  return (
    <>
      <CanaryModal onOpenChange={setCanaryOpen} />
      {activeModal && (
        <Suspense fallback={null}>
          <UpdateOverviewModal
            isOpen={showUpdateModal}
            onClose={handleCloseModal}
            title={activeModal.title}
            content={activeModal.content}
            bannerUrl={activeModal.banner_url}
          />
        </Suspense>
      )}
      <UserAlertsModal alerts={alerts} onDismiss={dismiss} />
      {survey && !canaryOpen && !showUpdateModal && alerts.length === 0 && (
        <SurveyModal survey={survey} onSubmitted={markSubmitted} />
      )}
    </>
  );
}
