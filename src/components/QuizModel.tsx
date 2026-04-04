import React from 'react';
import { motion } from "motion/react";
import { Brain, X, CheckCircle2, XCircle, Trophy } from 'lucide-react';

interface QuizModelProps {
  showQuiz: boolean;
  setShowQuiz: (show: boolean) => void;
  quizQuestions: any[];
  currentQuizIndex: number;
  setCurrentQuizIndex: React.Dispatch<React.SetStateAction<number>>;
  quizScore: number;
  setQuizScore: React.Dispatch<React.SetStateAction<number>>;
  quizAnswered: number | null;
  setQuizAnswered: React.Dispatch<React.SetStateAction<number | null>>;
  showQuizResult: boolean;
  setShowQuizResult: (show: boolean) => void;
}

const QuizModel: React.FC<QuizModelProps> = ({
  setShowQuiz,
  quizQuestions,
  currentQuizIndex,
  setCurrentQuizIndex,
  quizScore,
  setQuizScore,
  quizAnswered,
  setQuizAnswered,
  showQuizResult,
  setShowQuizResult
}) => {
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
                onClick={() => setShowQuiz(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border2)' }}>
                {!showQuizResult ? (
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: 'rgba(244,114,182,0.12)', color: '#F472B6' }}>
                                    <Brain size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Knowledge Check</p>
                                    <p className="text-[10px]" style={{ color: 'var(--text3)' }}>Q{currentQuizIndex + 1} of {quizQuestions.length}</p>
                                </div>
                            </div>
                            <button className="icon-btn" onClick={() => setShowQuiz(false)}><X size={14} /></button>
                        </div>
                        <p className="text-sm font-medium mb-4 leading-relaxed" style={{ color: 'var(--text)' }}>
                            {quizQuestions[currentQuizIndex].question}
                        </p>
                        <div className="space-y-2 mb-4">
                            {quizQuestions[currentQuizIndex].options.map((opt: string, i: number) => {
                                const correct = i === quizQuestions[currentQuizIndex].correctAnswer;
                                const selected = quizAnswered === i;
                                return (
                                    <button key={i} onClick={() => { if (quizAnswered !== null) return; setQuizAnswered(i); if (correct) setQuizScore(p => p + 1); }}
                                        className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-all"
                                        style={{
                                            background: quizAnswered === null ? 'var(--surface2)' : correct ? 'rgba(74,222,128,0.1)' : selected ? 'rgba(248,113,113,0.1)' : 'var(--surface2)',
                                            border: `1px solid ${quizAnswered === null ? 'var(--border)' : correct ? 'rgba(74,222,128,0.4)' : selected ? 'rgba(248,113,113,0.4)' : 'var(--border)'}`,
                                            color: quizAnswered === null ? 'var(--text)' : correct ? '#4ADE80' : selected ? 'var(--danger)' : 'var(--text3)',
                                            opacity: quizAnswered !== null && !correct && !selected ? 0.4 : 1,
                                        }}>
                                        {opt}
                                        {quizAnswered !== null && (correct ? <CheckCircle2 size={14} /> : selected ? <XCircle size={14} /> : null)}
                                    </button>
                                );
                            })}
                        </div>
                        {quizAnswered !== null && (
                            <div className="mb-4 p-3 rounded-xl text-xs leading-relaxed"
                                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
                                <span className="font-bold" style={{ color: 'var(--text)' }}>Explanation: </span>
                                {quizQuestions[currentQuizIndex].explanation}
                            </div>
                        )}
                        <button onClick={() => { if (currentQuizIndex < quizQuestions.length - 1) { setCurrentQuizIndex(p => p + 1); setQuizAnswered(null); } else setShowQuizResult(true); }}
                            disabled={quizAnswered === null}
                            className="btn btn-accent w-full justify-center py-2.5 text-sm disabled:opacity-30">
                            {currentQuizIndex === quizQuestions.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                            style={{ background: 'rgba(232,199,122,0.12)', color: 'var(--accent)' }}>
                            <Trophy size={28} />
                        </div>
                        <h3 className="f-serif text-2xl mb-1" style={{ color: 'var(--text)' }}>Quiz Complete!</h3>
                        <p className="text-sm mb-5" style={{ color: 'var(--text2)' }}>{quizScore} / {quizQuestions.length} correct</p>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            {[
                                { label: 'Accuracy', val: `${Math.round(quizScore / quizQuestions.length * 100)}%` },
                                { label: 'Correct', val: quizScore },
                            ].map(({ label, val }) => (
                                <div key={label} className="p-3 rounded-xl" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                                    <div className="text-xl font-bold mb-0.5" style={{ color: 'var(--accent)' }}>{val}</div>
                                    <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{label}</div>
                                </div>
                            ))}
                        </div>
                        <button className="btn btn-accent w-full justify-center py-2.5" onClick={() => setShowQuiz(false)}>
                            Back to Reading
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default QuizModel;