import { ResumeUpload } from "@/components/features/resume/resume-upload";
import { Navbar } from "@/components/layout/navbar";

export function DashboardShell({ user }: { user: any }) {
    const username = user?.email?.split('@')[0] || "User";

    return (
        <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden relative">
            <Navbar 
                username={username} 
                showMenuButton={false}
            />

            <div className="flex-1 w-full max-w-[1600px] mx-auto flex overflow-hidden relative">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                <main className="flex-1 h-full overflow-y-auto no-scrollbar relative z-10 flex items-center justify-center p-4">
                    <ResumeUpload selectedId={null} />
                </main>
            </div>
        </div>
    );
}
