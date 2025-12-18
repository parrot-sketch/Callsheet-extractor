import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/AuthDialog";
import { useState } from "react";

interface LandingPageProps {
    onSignIn: () => void;
}

export function LandingPage({ onSignIn }: LandingPageProps) {
    const [authDialogOpen, setAuthDialogOpen] = useState(false);

    const handleSignIn = () => {
        setAuthDialogOpen(true);
    };

    return (
        <div className="flex min-h-screen flex-col">
            {/* Nav */}
            <nav className="flex h-16 items-center justify-between border-b bg-background/50 px-8 backdrop-blur-sm">
                <span className="text-lg font-semibold tracking-tight">Callsheet Connector</span>
                <Button variant="ghost" size="sm" onClick={handleSignIn}>
                    Sign in
                </Button>
            </nav>

            {/* Hero */}
            <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 animate-in fade-in duration-700">
                <div className="max-w-2xl text-center space-y-8">
                    <h1 className="text-5xl font-bold tracking-tight sm:text-7xl bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                        Automate Your Production
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto">
                        Extract accurate contact lists and production details from callsheets in seconds.
                        Supports PDF, Excel, and Images.
                    </p>
                    <div className="flex justify-center pt-4">
                        <Button
                            size="lg"
                            className="h-12 px-8 text-base shadow-lg hover:shadow-xl transition-all"
                            onClick={handleSignIn}
                        >
                            Get Started
                        </Button>
                    </div>
                </div>

                {/* Features */}
                <div className="mt-32 grid max-w-4xl grid-cols-1 gap-12 sm:grid-cols-3">
                    {[
                        { icon: "📄", title: "Universal Import", desc: "Drag & drop PDF, Word, Excel, or Image callsheets." },
                        { icon: "⚡", title: "AI Extraction", desc: "Powered by advanced vision models for 99% accuracy." },
                        { icon: "📤", title: "Instant Export", desc: "Download as CSV/Excel or sync directly to your database." }
                    ].map((feature, i) => (
                        <div key={i} className="group text-center space-y-3 p-6 rounded-2xl transition-colors hover:bg-muted/50">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted group-hover:bg-background group-hover:shadow-sm transition-all text-2xl">
                                {feature.icon}
                            </div>
                            <h3 className="font-semibold">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground leading-normal">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </main>

            <AuthDialog
                open={authDialogOpen}
                onClose={() => setAuthDialogOpen(false)}
                onAuthSuccess={onSignIn}
            />
        </div>
    );
}
