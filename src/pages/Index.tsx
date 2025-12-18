import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, History, Upload } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { UploadSection } from "@/components/features/upload";
import { ResultsSection } from "@/components/features/results";
import { ProductionList, ProductionDetail } from "@/components/features/productions";
import { AuthDialog } from "@/components/AuthDialog";

import { useAuth } from "@/hooks/use-auth";
import { useProductions } from "@/hooks/use-productions";
import { useFileUpload } from "@/hooks/use-file-upload";

type View = "extract" | "history";

function getProductionNameFromFile(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export default function Index() {
  const { user, loading: authLoading, isAuthenticated, signOut } = useAuth();
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

  const [authDialogOpen, setAuthDialogOpen] = useState(false);
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

  useEffect(() => {
    if (isAuthenticated) loadProductions();
  }, [isAuthenticated, loadProductions]);

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

  // Loading
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Landing Page
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* Nav */}
        <nav className="flex h-16 items-center justify-between border-b bg-background/50 px-8 backdrop-blur-sm">
          <span className="text-lg font-semibold tracking-tight">Callsheet Connector</span>
          <Button variant="ghost" size="sm" onClick={() => setAuthDialogOpen(true)}>
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
                onClick={() => setAuthDialogOpen(true)}
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
          onAuthSuccess={() => setAuthDialogOpen(false)}
        />
      </div>
    );
  }

  // Main App
  return (
    <AppShell header={<Header email={user?.email} onSignOut={signOut} />}>
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
