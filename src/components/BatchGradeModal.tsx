import React, { useMemo, useState } from 'react';
import {
  X,
  ListChecks,
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Lightbulb,
  Lock,
} from 'lucide-react';
import { BatchParseResult, BatchEntry, classPatterns, downloadBatchCsv } from '../utils/batchGrading';
import { CHECKS } from '../utils/evaluation';

type SortKey = 'name' | 'score';

interface BatchGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  onTextChange: (text: string) => void;
  result: BatchParseResult | null;
  onGrade: () => void;
  onClear: () => void;
  /** Open submissions in this order (entry ids), starting at position `start`. */
  onReview: (order: number[], start: number) => void;
}

const scoreColor = (isThorough: boolean, score: number) =>
  isThorough
    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800'
    : score >= 70
      ? 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800'
      : 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800';

const lastName = (full: string) => {
  const parts = full.trim().split(/\s+/);
  return (parts.length > 1 ? parts[parts.length - 1] + ' ' + parts.slice(0, -1).join(' ') : full).toLowerCase();
};

export const BatchGradeModal: React.FC<BatchGradeModalProps> = ({
  isOpen,
  onClose,
  text,
  onTextChange,
  result,
  onGrade,
  onClear,
  onReview,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showPatterns, setShowPatterns] = useState(true);

  const entries = result?.entries ?? [];

  const visible: BatchEntry[] = useMemo(() => {
    return [...entries].sort((a, b) =>
      sortKey === 'score'
        ? b.evaluation.score - a.evaluation.score
        : lastName(a.submission.studentName || '').localeCompare(lastName(b.submission.studentName || ''))
    );
  }, [entries, sortKey]);

  const patterns = useMemo(() => classPatterns(visible), [visible]);
  const average = visible.length ? Math.round(visible.reduce((s, e) => s + e.evaluation.score, 0) / visible.length) : 0;
  const completeCount = visible.filter((e) => e.evaluation.isThorough).length;

  if (!isOpen) return null;
  const order = visible.map((e) => e.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full p-6 text-slate-800 dark:text-slate-100 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
              <ListChecks className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-['Outfit']">Batch Grade a Class</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Codes and results stay in this tab only. Nothing is saved or sent anywhere.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close batch grading"
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!result ? (
          /* ---------- Paste view ---------- */
          <div className="space-y-3 flex flex-col min-h-0">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Paste all your students' codes below. One per line works, and so does a whole column copied from
              Google Classroom or a spreadsheet. Names and other text mixed in are ignored.
            </p>
            <textarea
              id="textarea-batch-codes"
              autoFocus
              rows={12}
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="Paste student codes here..."
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl p-3 text-[11px] text-slate-800 dark:text-slate-100 font-mono outline-none resize-none placeholder:text-slate-400"
            />
            <button
              id="btn-run-batch-grade"
              onClick={onGrade}
              disabled={!text.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ListChecks className="w-4 h-4" />
              Grade All Codes
            </button>
          </div>
        ) : (
          /* ---------- Results view ---------- */
          <div className="space-y-3 overflow-y-auto pr-1 min-h-0">
            {/* Summary */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <b>{visible.length}</b> graded
              </span>
              <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <b>{completeCount}</b> complete
              </span>
              <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                Class average <b>{average}</b>
              </span>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => downloadBatchCsv(visible)}
                  disabled={!visible.length}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" /> Download CSV
                </button>
                <button
                  onClick={() => {
                    setExpandedId(null);
                    onClear();
                  }}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> New Batch
                </button>
              </div>
            </div>

            {/* Problems with the paste */}
            {(result.unreadable.length > 0 || result.duplicatesRemoved > 0) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                {result.unreadable.length > 0 && (
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      <b>{result.unreadable.length}</b> code{result.unreadable.length > 1 ? 's' : ''} couldn't be read
                      (cut off or mistyped when copied):{' '}
                      <span className="font-bold">{result.unreadable.join(', ')}</span>. Ask
                      {result.unreadable.length > 1 ? ' these students' : ' this student'} to copy their code again.
                    </span>
                  </div>
                )}
                {result.duplicatesRemoved > 0 && (
                  <div>
                    {result.duplicatesRemoved} exact duplicate code{result.duplicatesRemoved > 1 ? 's were' : ' was'} skipped.
                  </div>
                )}
              </div>
            )}

            {entries.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 p-4 text-center">
                No readable codes were found in what you pasted.
              </p>
            ) : (
              <>
                {/* Class patterns */}
                {patterns.length > 0 && (
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-xl">
                    <button
                      onClick={() => setShowPatterns(!showPatterns)}
                      className="w-full flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer"
                    >
                      {showPatterns ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <Lightbulb className="w-4 h-4" /> Class patterns: what students missed
                    </button>
                    {showPatterns && (
                      <div className="mt-2 space-y-1.5">
                        {patterns.map((p) => {
                          const pct = Math.round((100 * p.studentsMissing) / p.total);
                          return (
                            <div key={p.key} className="flex items-center gap-2 text-[11px]">
                              <span className="w-64 truncate" title={p.label}>{p.label}</span>
                              <div className="flex-1 h-2 rounded-full bg-indigo-100 dark:bg-indigo-950 overflow-hidden">
                                <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-28 text-right text-slate-600 dark:text-slate-300">
                                {p.studentsMissing} of {p.total} students
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Sort:</span>
                  {(['name', 'score'] as SortKey[]).map((k) => (
                    <button
                      key={k}
                      onClick={() => setSortKey(k)}
                      className={`px-2.5 py-1 rounded-full border cursor-pointer ${
                        sortKey === k
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {k === 'name' ? 'Last name' : 'Score'}
                    </button>
                  ))}
                  <button
                    onClick={() => onReview(order, 0)}
                    disabled={!order.length}
                    className="ml-auto px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Eye className="w-3.5 h-3.5" /> Review Work in This Order
                  </button>
                </div>

                {/* Table */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-[1.2fr_1.4fr_50px_70px_70px_100px] gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <span>Student</span>
                    <span>Song</span>
                    <span className="text-right">BPM</span>
                    <span className="text-right">Sections</span>
                    <span className="text-center">Score</span>
                    <span />
                  </div>
                  {visible.map((e, pos) => {
                    const open = expandedId === e.id;
                    const md = e.submission.songMetadata;
                    return (
                      <div key={e.id} className="border-t border-slate-100 dark:border-slate-800">
                        <div
                          onClick={() => setExpandedId(open ? null : e.id)}
                          className="grid grid-cols-[1.2fr_1.4fr_50px_70px_70px_100px] gap-2 px-3 py-2 items-center text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                        >
                          <span className="font-bold truncate flex items-center gap-1.5">
                            {open ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                            {e.submission.studentName || 'Unnamed student'}
                            {e.hasMultipleSubmissions && (
                              <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 px-1.5 rounded-full shrink-0">
                                multiple codes
                              </span>
                            )}
                          </span>
                          <span className="truncate text-slate-600 dark:text-slate-300" title={`${md.title} — ${md.artist}`}>
                            {md.title || 'Untitled'}{md.artist ? ` — ${md.artist}` : ''}
                          </span>
                          <span className="text-right text-slate-600 dark:text-slate-300">{md.bpm || '—'}</span>
                          <span className="text-right text-slate-600 dark:text-slate-300">{e.submission.sections.length}</span>
                          <span className={`text-center font-bold rounded-full border px-1.5 py-0.5 ${scoreColor(e.evaluation.isThorough, e.evaluation.score)}`}>
                            {e.evaluation.score}
                          </span>
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              onReview(order, pos);
                            }}
                            className="justify-self-end px-2.5 py-1 rounded-full bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View work
                          </button>
                        </div>
                        {open && (
                          <div className="px-4 pb-3 pt-1 bg-slate-50/60 dark:bg-slate-800/30">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {CHECKS.map((c) => {
                                const missing = e.evaluation.issueKeys?.includes(c.key);
                                return (
                                  <div key={c.key} className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                    <span className="flex items-center gap-1.5 truncate">
                                      {missing ? (
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      ) : (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      )}
                                      {c.label}
                                    </span>
                                    <span className={`font-bold ${missing ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                      {missing ? 'Missing' : 'OK'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
