import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  RotateCcw,
  UserRound,
  X,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPage from '../../components/admin/AdminPage';
import AdminRefreshButton from '../../components/admin/AdminRefreshButton';
import AdminSearchInput from '../../components/admin/AdminSearchInput';
import AdminSelect from '../../components/admin/AdminSelect';
import AdminStatCards from '../../components/admin/AdminStatCards';
import AdminToolbar from '../../components/admin/AdminToolbar';
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoading,
} from '../../components/admin/AdminStates';
import { useAdminConfirm } from '../../components/admin/useAdminConfirm';
import {
  fetchAdminSurveyResponses,
  fetchAdminSurveyResults,
  fetchAdminSurveys,
  resetAdminSurveyResponse,
  type AdminSurveyResponse,
  type AdminSurveyResults,
  type AdminSurveySummary,
} from '../../utils/fetch/admin/surveys';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { minDuration } from '@/lib/minDuration';
import { toast } from 'sonner';

const PAGE_SIZE = 25;

function Answer({ value }: { value: boolean | undefined }) {
  if (value === undefined) {
    return <span className="text-xs text-muted-foreground">–</span>;
  }
  return value ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-500">
      <Check className="size-3.5" aria-hidden />
      Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
      <X className="size-3.5" aria-hidden />
      No
    </span>
  );
}

function QuestionTag({ index, text }: { index: number; text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="cursor-default text-xs font-medium text-muted-foreground tabular-nums"
        >
          Q{index + 1}
        </span>
      </TooltipTrigger>
      <TooltipContent className="shadcn-scope max-w-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export default function AdminSurveys() {
  const [surveys, setSurveys] = useState<AdminSurveySummary[]>([]);
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [results, setResults] = useState<AdminSurveyResults | null>(null);
  const [responses, setResponses] = useState<AdminSurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { confirm, confirmDialog } = useAdminConfirm();

  useEffect(() => {
    if (search === debouncedSearch) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  const loadSurveys = useCallback(async () => {
    try {
      const list = await fetchAdminSurveys();
      setSurveys(list);
      setSurveyId(
        (current) =>
          current ?? list.find((s) => s.active)?.id ?? list[0]?.id ?? null
      );
      if (list.length === 0) setLoading(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load surveys';
      setError(message);
      setLoading(false);
      toast.error(message);
    }
  }, []);

  const loadResults = useCallback(async () => {
    if (!surveyId) return;
    try {
      setLoading(true);
      setError(null);
      setResults(await fetchAdminSurveyResults(surveyId));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load survey results';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  const loadResponses = useCallback(async () => {
    if (!surveyId) return;
    try {
      setListLoading(true);
      const data = await fetchAdminSurveyResponses(surveyId, {
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
      });
      setResponses(data.responses);
      setPages(data.pagination.pages);
      setTotal(data.pagination.total);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to load responses'
      );
    } finally {
      setListLoading(false);
    }
  }, [surveyId, page, debouncedSearch]);

  useEffect(() => {
    void loadSurveys();
  }, [loadSurveys]);

  useEffect(() => {
    void loadResults();
  }, [loadResults]);

  useEffect(() => {
    void loadResponses();
  }, [loadResponses]);

  const refresh = () => {
    void loadSurveys();
    void loadResults();
    void loadResponses();
  };

  const questions = useMemo(() => results?.questions ?? [], [results]);

  const handleReset = async (r: AdminSurveyResponse) => {
    if (!surveyId) return;
    await confirm({
      title: `Reset ${r.username}'s answers?`,
      description:
        'Their answers are deleted and they will have to fill in the survey again on their next visit.',
      confirmText: 'Reset',
      destructive: true,
      action: async () => {
        try {
          await minDuration(resetAdminSurveyResponse(surveyId, r.userId));
          toast.success(`Reset ${r.username}'s answers`);
          refresh();
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : 'Failed to reset answers'
          );
          throw err;
        }
      },
    });
  };

  const totalResponses = results?.totalResponses ?? 0;

  return (
    <AdminLayout>
      <AdminPage
        title="Surveys"
        icon={ClipboardList}
        description={results?.survey.description}
        actions={
          <AdminRefreshButton
            onClick={refresh}
            loading={loading || listLoading}
          />
        }
      >
        {surveys.length > 1 ? (
          <AdminToolbar>
            <AdminSelect
              options={surveys.map((s) => ({
                value: s.id,
                label: `${s.title}${s.active ? ' (active)' : ''}`,
              }))}
              value={surveyId ?? ''}
              onChange={(value) => {
                setSurveyId(value);
                setPage(1);
              }}
              aria-label="Survey"
              className="sm:w-72"
            />
          </AdminToolbar>
        ) : null}

        {loading && !results ? (
          <AdminLoading label="Loading survey results…" />
        ) : error ? (
          <AdminErrorState
            title="Error loading survey"
            message={error}
            onRetry={loadResults}
          />
        ) : !results ? (
          <AdminEmptyState icon={ClipboardList} title="No surveys defined" />
        ) : (
          <>
            <AdminStatCards
              columns={3}
              items={[
                {
                  label: 'Responses',
                  value: totalResponses.toLocaleString(),
                },
                {
                  label: 'Status',
                  value: results.survey.active ? 'Active' : 'Inactive',
                  sub: results.survey.active
                    ? 'Shown to every logged-in user who has not answered'
                    : 'Not shown to anyone',
                },
                { label: 'Questions', value: questions.length },
              ]}
            />

            <section className="grid gap-3">
              <h2 className="text-sm font-medium">Results per question</h2>
              <div className="grid gap-3 lg:grid-cols-3">
                {questions.map((q, i) => {
                  const yesPct = pct(q.yes, q.yes + q.no);
                  return (
                    <div
                      key={q.id}
                      className="grid gap-3 rounded-3xl border-2 border-zinc-800 bg-zinc-900 p-4"
                    >
                      <p className="text-sm text-zinc-300">
                        <span className="text-zinc-500 tabular-nums">
                          {i + 1}.
                        </span>{' '}
                        {q.text}
                      </p>
                      <div
                        className="flex h-2.5 overflow-hidden rounded-full bg-zinc-800"
                        role="img"
                        aria-label={`${q.yes} yes, ${q.no} no`}
                      >
                        <div
                          className="h-full bg-green-600"
                          style={{ width: `${yesPct}%` }}
                        />
                        <div
                          className="h-full bg-red-600"
                          style={{
                            width: `${q.yes + q.no > 0 ? 100 - yesPct : 0}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs tabular-nums">
                        <span className="inline-flex items-center gap-1 text-green-500">
                          <Check className="size-3.5" aria-hidden />
                          Yes {q.yes.toLocaleString()} ({yesPct}%)
                        </span>
                        <span className="inline-flex items-center gap-1 text-red-500">
                          <X className="size-3.5" aria-hidden />
                          No {q.no.toLocaleString()} (
                          {q.yes + q.no > 0 ? 100 - yesPct : 0}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {results.combinations.length > 0 ? (
              <section className="grid gap-3">
                <h2 className="text-sm font-medium">Answer combinations</h2>
                <div className="overflow-x-auto rounded-3xl border-2 border-zinc-800 bg-zinc-900">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        {questions.map((q, i) => (
                          <th key={q.id} className="px-4 py-2.5 font-normal">
                            <QuestionTag index={i} text={q.text} />
                          </th>
                        ))}
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                          Users
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.combinations.map((c) => (
                        <tr key={JSON.stringify(c.answers)}>
                          {questions.map((q) => (
                            <td key={q.id} className="px-4 py-2">
                              <Answer value={c.answers[q.id]} />
                            </td>
                          ))}
                          <td className="px-4 py-2 text-right text-zinc-300 tabular-nums">
                            {c.count.toLocaleString()}{' '}
                            <span className="text-muted-foreground">
                              ({pct(c.count, totalResponses)}%)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            <section className="grid gap-3">
              <h2 className="text-sm font-medium">Responses</h2>
              <AdminToolbar>
                <AdminSearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search by username or user ID…"
                  loading={search !== debouncedSearch || listLoading}
                />
              </AdminToolbar>

              {listLoading && responses.length === 0 ? (
                <AdminLoading label="Loading responses…" />
              ) : responses.length === 0 ? (
                <AdminEmptyState
                  icon={ClipboardList}
                  title={
                    debouncedSearch
                      ? 'No responses match your search'
                      : 'No responses yet'
                  }
                />
              ) : (
                <>
                  <div className="grid gap-2">
                    {responses.map((r) => (
                      <div
                        key={r.userId}
                        className="flex flex-col gap-3 rounded-3xl border-2 border-zinc-800 bg-zinc-900 px-4 py-3 hover:border-zinc-700 hover:bg-zinc-800/60 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <Avatar>
                            {r.avatar ? (
                              <AvatarImage
                                src={`https://cdn.discordapp.com/avatars/${r.userId}/${r.avatar}.png`}
                                alt={r.username}
                              />
                            ) : null}
                            <AvatarFallback>
                              <UserRound className="size-4 text-zinc-500" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {r.username}
                            </p>
                            <p className="truncate font-mono text-xs text-zinc-500">
                              {r.userId}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          {questions.map((q, i) => (
                            <span
                              key={q.id}
                              className="inline-flex items-center gap-1.5"
                            >
                              <QuestionTag index={i} text={q.text} />
                              <Answer value={r.answers[q.id]} />
                            </span>
                          ))}
                        </div>
                        <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                          <span className="text-xs text-zinc-500 tabular-nums">
                            {new Date(r.createdAt).toLocaleString()}
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => void handleReset(r)}
                                className="cursor-pointer text-destructive hover:text-destructive"
                                aria-label={`Reset ${r.username}'s answers`}
                              >
                                <RotateCcw />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="shadcn-scope">
                              Reset answers
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col items-center justify-end gap-3 sm:flex-row">
                    <p className="text-sm text-muted-foreground tabular-nums">
                      Page {page} of {Math.max(1, pages)} ·{' '}
                      {total.toLocaleString()} total
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.min(pages, page + 1))}
                        disabled={page >= pages}
                      >
                        Next
                        <ChevronRight />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </AdminPage>
      {confirmDialog}
    </AdminLayout>
  );
}
