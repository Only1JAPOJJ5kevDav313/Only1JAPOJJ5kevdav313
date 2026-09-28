import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminModal from './AdminModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { minDuration } from '@/lib/minDuration';
import type { AdminSurveyInput } from '../../utils/fetch/admin/surveys';

const MAX_QUESTIONS = 10;

type DraftQuestion = { key: string; id?: string; text: string };

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: AdminSurveyInput;
  responseCount?: number;
  onClose: () => void;
  onSave: (input: AdminSurveyInput) => Promise<void>;
};

let keySeq = 0;
const nextKey = () => `draft-${++keySeq}`;

function IconAction({
  label,
  icon: Icon,
  onClick,
  disabled,
  destructive,
}: {
  label: string;
  icon: typeof Trash2;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className={
            destructive
              ? 'cursor-pointer text-destructive hover:text-destructive'
              : 'cursor-pointer'
          }
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="shadcn-scope">{label}</TooltipContent>
    </Tooltip>
  );
}

export default function AdminSurveyEditor({
  open,
  mode,
  initial,
  responseCount = 0,
  onClose,
  onSave,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setDescription(initial?.description ?? '');
    setQuestions(
      initial?.questions.length
        ? initial.questions.map((q) => ({ ...q, key: nextKey() }))
        : [{ key: nextKey(), text: '' }]
    );
  }, [open, initial]);

  const valid =
    title.trim().length > 0 &&
    questions.length > 0 &&
    questions.every((q) => q.text.trim().length > 0);

  const move = (index: number, delta: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });
  };

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await minDuration(
        onSave({
          title: title.trim(),
          description: description.trim(),
          questions: questions.map(({ id, text }) => ({
            ...(id ? { id } : {}),
            text: text.trim(),
          })),
        })
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save survey');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      title={mode === 'create' ? 'New survey' : 'Edit survey'}
      description="Every question is answered with yes or no."
      size="lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="cursor-pointer"
            onClick={() => void save()}
            disabled={!valid || saving}
          >
            {saving ? <Loader2 className="animate-spin" /> : null}
            {mode === 'create' ? 'Create survey' : 'Save changes'}
          </Button>
        </>
      }
    >
      <div className="grid gap-5">
        {mode === 'edit' && responseCount > 0 ? (
          <p className="rounded-xl border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            {responseCount.toLocaleString()} user
            {responseCount === 1 ? ' has' : 's have'} already answered. They
            won&apos;t be asked again, and answers to removed questions are
            hidden. To ask everyone again, create a new survey instead.
          </p>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="survey-title">
            Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="survey-title"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Help us shape PFControl"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="survey-description">Description</Label>
          <Textarea
            id="survey-description"
            value={description}
            maxLength={500}
            rows={2}
            className="resize-none"
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Shown on the welcome screen"
          />
        </div>

        <div className="grid gap-2">
          <Label>
            Questions <span className="text-red-500">*</span>
          </Label>
          <ol className="grid gap-2">
            {questions.map((q, i) => (
              <li key={q.key} className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
                  {i + 1}.
                </span>
                <Input
                  value={q.text}
                  maxLength={300}
                  aria-label={`Question ${i + 1}`}
                  placeholder="Ask a yes/no question"
                  onChange={(e) =>
                    setQuestions((prev) =>
                      prev.map((p) =>
                        p.key === q.key ? { ...p, text: e.target.value } : p
                      )
                    )
                  }
                />
                <div className="flex shrink-0 items-center">
                  <IconAction
                    label="Move up"
                    icon={ArrowUp}
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  />
                  <IconAction
                    label="Move down"
                    icon={ArrowDown}
                    disabled={i === questions.length - 1}
                    onClick={() => move(i, 1)}
                  />
                  <IconAction
                    label="Remove question"
                    icon={Trash2}
                    destructive
                    disabled={questions.length === 1}
                    onClick={() =>
                      setQuestions((prev) =>
                        prev.filter((p) => p.key !== q.key)
                      )
                    }
                  />
                </div>
              </li>
            ))}
          </ol>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit cursor-pointer"
            disabled={questions.length >= MAX_QUESTIONS}
            onClick={() =>
              setQuestions((prev) => [...prev, { key: nextKey(), text: '' }])
            }
          >
            <Plus />
            Add question
          </Button>
        </div>
      </div>
    </AdminModal>
  );
}
