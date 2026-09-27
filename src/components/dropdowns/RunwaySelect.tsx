import { useEffect } from 'react';
import { useData } from '../../hooks/data/useData';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FIELD_OPTION_CLASS,
  FIELD_PANEL_CLASS,
  FIELD_TRIGGER_CLASS,
} from './fieldStyles';

const NONE = '__none';

export default function RunwaySelect({
  id,
  airportIcao,
  value,
  onChange,
  disabled,
  placeholder = 'Select runway',
  noneLabel,
}: {
  id?: string;
  airportIcao: string;
  value: string;
  onChange: (runway: string) => void;
  disabled?: boolean;
  placeholder?: string;
  noneLabel?: string;
}) {
  const { airportRunways, fetchAirportData, fetchedAirports } = useData();

  useEffect(() => {
    if (airportIcao && !fetchedAirports.has(airportIcao)) {
      fetchAirportData(airportIcao);
    }
  }, [airportIcao, fetchedAirports, fetchAirportData]);

  const runways = airportRunways[airportIcao] ?? [];
  const loading = Boolean(airportIcao) && !airportRunways[airportIcao];

  const shownPlaceholder = !airportIcao
    ? 'Select an airport first'
    : loading
      ? 'Loading runways…'
      : runways.length === 0
        ? 'No runways available'
        : placeholder;

  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next === NONE ? '' : next)}
      disabled={disabled || !airportIcao || loading || runways.length === 0}
    >
      <SelectTrigger
        id={id}
        className={cn(
          FIELD_TRIGGER_CLASS,
          'shadow-none data-[size=default]:h-11 dark:bg-zinc-950 dark:hover:bg-zinc-950'
        )}
      >
        <SelectValue placeholder={shownPlaceholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        className={cn('shadcn-scope p-0', FIELD_PANEL_CLASS)}
      >
        {noneLabel && (
          <>
            <SelectItem
              value={NONE}
              className={cn(FIELD_OPTION_CLASS, 'text-zinc-400')}
            >
              {noneLabel}
            </SelectItem>
            <SelectSeparator />
          </>
        )}
        {runways.map((runway) => (
          <SelectItem
            key={runway}
            value={runway}
            className={cn(FIELD_OPTION_CLASS, 'font-mono')}
          >
            {runway}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
