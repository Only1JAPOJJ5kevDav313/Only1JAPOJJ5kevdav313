import { useMemo, useRef, useState } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Check, ChevronDown } from 'lucide-react';
import { useData } from '../../hooks/data/useData';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  FIELD_OPTION_CLASS,
  FIELD_PANEL_CLASS,
  FIELD_TRIGGER_CLASS,
} from './fieldStyles';

export default function AirportCombobox({
  id,
  value,
  onChange,
  disabled,
}: {
  id?: string;
  value: string;
  onChange: (icao: string) => void;
  disabled?: boolean;
}) {
  const { airports, loading } = useData();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const options = useMemo(
    () =>
      (Array.isArray(airports) ? airports : []).filter(
        (airport) => !airport.controlName?.includes('Center')
      ),
    [airports]
  );
  const selected = options.find((airport) => airport.icao === value);
  const selectedLabel = selected ? `${selected.icao} - ${selected.name}` : '';

  const openList = () => {
    if (disabled || loading) return;
    setQuery('');
    setOpen(true);
  };

  const select = (icao: string) => {
    onChange(icao);
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <Command className="overflow-visible rounded-none bg-transparent">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div ref={anchorRef} className="relative">
            <CommandPrimitive.Input
              ref={inputRef}
              id={id}
              value={open ? query : selectedLabel}
              onValueChange={setQuery}
              onFocus={openList}
              onClick={() => !open && openList()}
              onBlur={() => setOpen(false)}
              placeholder={loading ? 'Loading airports…' : 'Select airport'}
              disabled={disabled || loading}
              autoComplete="off"
              className={cn(
                FIELD_TRIGGER_CLASS,
                'cursor-text pr-9 placeholder:text-muted-foreground',
                open && 'border-blue-400'
              )}
            />
            <ChevronDown
              className={cn(
                'pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground transition-transform',
                open && 'rotate-180'
              )}
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (anchorRef.current?.contains(e.target as Node)) {
              e.preventDefault();
            }
          }}
          onMouseDown={(e) => e.preventDefault()}
          className={cn(
            'shadcn-scope w-(--radix-popover-trigger-width) overflow-hidden p-0',
            FIELD_PANEL_CLASS
          )}
        >
          <CommandList className="no-scrollbar max-h-72">
            <CommandEmpty>No airports found.</CommandEmpty>
            <CommandGroup>
              {options.map((airport) => (
                <CommandItem
                  key={airport.icao}
                  value={`${airport.icao} ${airport.name}`}
                  onSelect={() => select(airport.icao)}
                  className={FIELD_OPTION_CLASS}
                >
                  <span className="font-mono font-medium">{airport.icao}</span>
                  <span className="truncate text-zinc-400 group-data-[selected=true]/option:text-blue-100">
                    {airport.name}
                  </span>
                  <Check
                    className={cn(
                      'ml-auto',
                      airport.icao === value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </PopoverContent>
      </Popover>
    </Command>
  );
}
