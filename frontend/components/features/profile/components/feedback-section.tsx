"use client";

import { MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export function FeedbackSection({ userEmail, userName }: { userEmail?: string, userName?: string }) {
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!feedback.trim()) return;

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: feedback,
                    email: userEmail,
                    user_name: userName
                })
            });

            if (res.ok) {
                setIsSent(true);
                setFeedback("");
                setTimeout(() => setIsSent(false), 3000);
            } else {
                alert("Failed to send feedback. Please try again.");
            }
        } catch (error) {
            alert("Network error sending feedback.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 ease-out">
            <header className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white font-heading">
                            Feedback
                        </h2>
                        <p className="text-white/40 text-xs font-light leading-relaxed">
                            Report issues, suggest features, or just tell us how we're doing.
                        </p>
                    </div>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="group bg-zinc-950/40 border border-primary/20 hover:border-primary/45 focus-within:border-primary/70 focus-within:shadow-[0_0_30px_rgba(242,170,76,0.08)] rounded-2xl px-5 py-4 transition-all">
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20 resize-none min-h-[160px]"
                        placeholder="What's on your mind? We'd love to hear from you..."
                        required
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={!feedback.trim() || isSubmitting || isSent}
                        className="group relative px-6 py-3 bg-primary text-black rounded-xl font-extrabold text-[10px] uppercase tracking-[0.15em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(242,170,76,0.2)] disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            "Sending..."
                        ) : isSent ? (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Sent!
                            </>
                        ) : (
                            <>
                                Send Feedback
                                <Send className="w-3.5 h-3.5" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
