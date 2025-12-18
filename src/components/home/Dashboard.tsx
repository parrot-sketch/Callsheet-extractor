import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, History, Upload } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { UploadSection } from "@/components/features/upload";
import { ResultsSection } from "@/components/features/results";
import { ProductionList, ProductionDetail } from "@/components/features/productions";

import { useProductions } from "@/hooks/use-productions";
import { useFileUpload } from "@/hooks/use-file-upload";

// Helper
function getProductionNameFromFile(filename: string): string {
    return filename.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

type View = "extract" | "history";

interface DashboardProps {
    userEmail?: string | null;
    onSignOut: () => void;
}

export function Dashboard({ userEmail, onSignOut }: DashboardProps) {
    const {
        productions,
        selectedProduction,
        loading: productionsLoading,
        loadProductions,
        loadProductionDetail,
        setSelectedProduction,
    } = useProductions();

    const {
        result,
        error: uploadError,
        selectedFile,
        handleFileSelect,
        upload,
        reset,
        isProcessing,
    } = useFileUpload({
        onSuccess: loadProductions,
    });

    const [view, setView] = useState<View>("extract");
    const [productionName, setProductionName] = useState("");
    const [pastedText, setPastedText] = useState("");

    const handleFileSelectWithName = useCallback(
        (file: File | null) => {
            handleFileSelect(file);
            if (file && !productionName.trim()) {
                setProductionName(getProductionNameFromFile(file.name));
            }
        },
        [handleFileSelect, productionName]
    );

    const handleSubmit = () => {
        const name = productionName.trim() ||
            (selectedFile ? getProductionNameFromFile(selectedFile.name) : "Untitled");

        if (pastedText.trim()) {
            upload(name, pastedText);
        } else {
            upload(name);
        }
    };

    const handleReset = useCallback(() => {
        reset();
        setProductionName("");
        setPastedText("");
    }, [reset]);

    return (
        <AppShell header={<Header email={userEmail} onSignOut={onSignOut} />}>
            <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
                <div className="mx-auto max-w-4xl px-4 py-12">

                    {/* Navigation Segments */}
                    <div className="mb-12 flex justify-center">
                        <div className="inline-flex rounded-lg border bg-background p-1 text-muted-foreground shadow-sm">
                            <button
                                onClick={() => { setView("extract"); setSelectedProduction(null); }}
                                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${view === "extract"
                                        ? "bg-foreground text-background shadow-sm"
                                        : "hover:bg-muted hover:text-foreground"
                                    }`}
                            >
                                <Upload className="h-4 w-4" />
                                New Extraction
                            </button>
                            <button
                                onClick={() => setView("history")}
                                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${view === "history"
                                        ? "bg-foreground text-background shadow-sm"
                                        : "hover:bg-muted hover:text-foreground"
                                    }`}
                            >
                                <History className="h-4 w-4" />
                                History
                                {productions.length > 0 && (
                                    <span className="ml-1 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-[10px] tabular-nums">
                                        {productions.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {view === "extract" && (
                            <div className="mx-auto max-w-2xl">
                                {result ? (
                                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                                        <div className="p-6">
                                            <div className="mb-6 flex items-center justify-between">
                                                <h2 className="text-lg font-semibold">Extraction Results</h2>
                                                <Button variant="outline" size="sm" onClick={handleReset}>
                                                    Start Over
                                                </Button>
                                            </div>
                                            <ResultsSection result={result} onReset={handleReset} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                                        <div className="p-8">
                                            <UploadSection
                                                productionName={productionName}
                                                onProductionNameChange={setProductionName}
                                                selectedFile={selectedFile}
                                                onFileSelect={handleFileSelectWithName}
                                                pastedText={pastedText}
                                                onPastedTextChange={setPastedText}
                                                onSubmit={handleSubmit}
                                                isProcessing={isProcessing}
                                                error={uploadError}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {view === "history" && (
                            <div className="mx-auto max-w-3xl">
                                {productionsLoading ? (
                                    <div className="flex justify-center py-20">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : selectedProduction ? (
                                    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                                        <div className="border-b bg-muted/50 px-6 py-4">
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedProduction(null)} className="-ml-2">
                                                ← Back to List
                                            </Button>
                                        </div>
                                        <div className="p-6">
                                            <ProductionDetail
                                                data={selectedProduction}
                                                onBack={() => setSelectedProduction(null)}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between px-2">
                                            <h2 className="text-lg font-semibold tracking-tight">Recent Productions</h2>
                                        </div>
                                        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                                            <ProductionList
                                                productions={productions}
                                                onSelect={loadProductionDetail}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
