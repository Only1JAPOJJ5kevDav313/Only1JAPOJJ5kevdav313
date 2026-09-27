import { useEffect, useState } from 'react';
import { Check, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { minDuration } from '@/lib/minDuration';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type AtisReminderNetworkKind = 'pfatc' | 'advanced_atc';

interface AtisReminderModalProps {
  onContinue: () => void;
  atisText: string;
  accessId: string;
  userId: string;
  sessionId: string;
  airportIcao: string;
  airportName: string;
  airportControlName: string;
  airportAppFrequency: string;
  airportFrequencyType: string;
  networkSessionKind: AtisReminderNetworkKind;
}

const CONTROL_SUFFIX: Record<string, string> = {
  APP: 'Approach',
  TWR: 'Tower',
  GND: 'Ground',
  DEL: 'Delivery',
};

export default function AtisReminderModal({
  onContinue,
  atisText,
  sessionId,
  userId,
  airportIcao,
  airportName,
  airportControlName,
  airportAppFrequency,
  airportFrequencyType,
  networkSessionKind,
}: AtisReminderModalProps) {
  const isAdvancedAtc = networkSessionKind === 'advanced_atc';
  const submitLink = `${window.location?.origin}/submit/${sessionId}`;
  const [copied, setCopied] = useState(false);
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  const suffix =
    airportFrequencyType === 'APP' && airportIcao === 'EGKK'
      ? 'Director'
      : CONTROL_SUFFIX[airportFrequencyType];
  const formattedControlName =
    airportControlName && suffix ? `${airportControlName} ${suffix}` : null;

  const header = formattedControlName
    ? `${airportIcao}_${airportFrequencyType} "${formattedControlName}" (${airportAppFrequency})`
    : `${airportIcao}_${airportFrequencyType} (${airportAppFrequency})`;
  const formattedAtis = `${header}: <@${userId}>\n\n${atisText}\n\n${submitLink}`;
  const clipboardText = `${airportName}\n\n${formattedAtis}`;

  const copyAtis = async () => {
    try {
      await navigator.clipboard.writeText(clipboardText);
      return true;
    } catch {
      toast.error('Could not copy the ATIS');
      return false;
    }
  };

  const handleCopy = async () => {
    if (await copyAtis()) setCopied(true);
  };

  const handleCopyAndContinue = async () => {
    if (continuing) return;
    setContinuing(true);
    await minDuration(
      navigator.clipboard.writeText(clipboardText).catch(() => {})
    );
    onContinue();
  };

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="shadcn-scope gap-4 rounded-4xl border-2 border-zinc-800 bg-zinc-900 p-5 sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isAdvancedAtc
              ? 'Advanced ATC ATIS format reminder'
              : 'PFATC Network ATIS format reminder'}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {isAdvancedAtc ? (
              <>
                For an{' '}
                <span className="font-medium text-blue-400">Advanced ATC</span>{' '}
                session, use the same public-network ATIS layout as PFATC (shown
                below) so pilots and overview stay consistent.
              </>
            ) : (
              <>
                If you want to use this on the{' '}
                <span className="font-medium text-blue-400">PFATC Network</span>
                , use the ATIS format below:
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-w-0 rounded-2xl border-2 border-zinc-800 bg-zinc-950 p-4 font-mono text-sm text-zinc-300">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Copy ATIS"
                  onClick={handleCopy}
                  className="absolute top-3 right-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus-visible:bg-blue-600 focus-visible:text-white focus-visible:ring-0 dark:hover:bg-blue-600"
                >
                  {copied ? <Check /> : <Copy />}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="shadcn-scope" sideOffset={6}>
                {copied ? 'Copied!' : 'Copy ATIS'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="mb-2 pr-10 font-bold text-blue-400">
            {airportName}
          </div>
          <pre className="max-h-[50vh] overflow-y-auto pr-10 break-words whitespace-pre-wrap">
            {formattedAtis}
          </pre>
        </div>

        <Button
          size="lg"
          className="h-11 w-full rounded-xl"
          onClick={handleCopyAndContinue}
          disabled={continuing}
        >
          {continuing && <Loader2 className="animate-spin" />}
          Copy and continue to session
        </Button>
      </DialogContent>
    </Dialog>
  );
}
