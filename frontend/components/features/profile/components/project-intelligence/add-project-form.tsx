"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, X, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";
import { DeploymentItem, FeatureInput } from "@/types";
import { COMMON_TECH_STACK } from "@/lib/constants";
import { DeploymentForm } from "./deployment-form";

interface AddProjectFormProps {
    projectName: string;
    setProjectName: (val: string) => void;
    context: string;
    setContext: (val: string) => void;
    techStack: string[];
    setTechStack: (val: string[]) => void;
    features: FeatureInput[];
    setFeatures: (val: FeatureInput[]) => void;
    deployments: DeploymentItem[];
    setDeployments: (val: DeploymentItem[]) => void;
    uploading: boolean;
    onSubmit: () => void;
    onClose: () => void;
}

export function AddProjectForm({
    projectName, setProjectName,
    context, setContext,
    techStack, setTechStack,
    features, setFeatures,
    deployments, setDeployments,
    uploading, onSubmit, onClose,
}: AddProjectFormProps) {
    const [techDropdownOpen, setTechDropdownOpen] = useState(false);
    const [customTech, setCustomTech] = useState("");
    const techDropdownRef = useRef<HTMLDivElement>(null);

    const [newComponent, setNewComponent] = useState("Frontend");
    const [customNewComponent, setCustomNewComponent] = useState("");
    const [newPlatform, setNewPlatform] = useState("");
    const [customNewPlatform, setCustomNewPlatform] = useState("");

    const toggleTech = (tech: string) => {
        setTechStack(techStack.includes(tech) ? techStack.filter((t) => t !== tech) : [...techStack, tech]);
    };

    const addCustomTech = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && customTech.trim()) {
            e.preventDefault();
            if (!techStack.includes(customTech.trim())) setTechStack([...techStack, customTech.trim()]);
            setCustomTech("");
        }
    };

    const addFeature = () => {
        setFeatures([...features, { id: Math.random().toString(), name: "", description: "", commits: "" }]);
    };

    const removeFeature = (id: string) => setFeatures(features.filter((f) => f.id !== id));

    const updateFeature = (id: string, field: keyof FeatureInput, value: string) => {
        setFeatures(features.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
    };

    const handleAddDeployment = () => {
        const finalComp = newComponent === "Other (Custom)" ? customNewComponent : newComponent;
        const finalPlat = newPlatform === "Other (Custom)" ? customNewPlatform : newPlatform;
        if (!finalPlat.trim() || !finalComp.trim()) return;
        setDeployments([...deployments, { component: finalComp, platform: finalPlat, status: "accepted" }]);
        setNewPlatform("");
        setCustomNewPlatform("");
        setNewComponent("Frontend");
        setCustomNewComponent("");
    };

    return (
        <div className="bg-zinc-950/40 border border-primary/20 rounded-2xl p-6 space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-primary/20">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">Add Project Manually</h3>
                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-white/70 block mb-2">Project Name</label>
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-primary/20 hover:border-primary/45 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary/70 focus:outline-none"
                        placeholder="e.g. Offer Fit"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-white/70 block mb-2">Deployments</label>
                    {deployments.length > 0 && (
                        <div className="space-y-2 mb-3 bg-zinc-950/60 border border-white/[0.04] p-3 rounded-xl">
                            {deployments.map((dep, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                                            {dep.component}
                                        </span>
                                        <span className="text-white/80 font-bold">{dep.platform}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setDeployments(deployments.filter((_, i) => i !== idx))}
                                        className="text-white/40 hover:text-red-400 p-1 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <DeploymentForm
                        component={newComponent} setComponent={setNewComponent}
                        customComponent={customNewComponent} setCustomComponent={setCustomNewComponent}
                        platform={newPlatform} setPlatform={setNewPlatform}
                        customPlatform={customNewPlatform} setCustomPlatform={setCustomNewPlatform}
                        onAdd={handleAddDeployment}
                    />
                    <p className="text-[10px] text-white/40 mt-2.5 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Add all components of your application (e.g. Next.js on Vercel, FastAPI on Render).</span>
                    </p>
                </div>

                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-white/70 block mb-2">Project Description (Context)</label>
                    <textarea
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        className="w-full h-24 bg-zinc-900/50 border border-primary/20 hover:border-primary/45 rounded-xl px-4 py-3 text-xs text-white focus:border-primary/75 focus:outline-none resize-none"
                        placeholder="What does this project do? Who is it for? What problem does it solve?"
                    />
                </div>

                <div className="relative" ref={techDropdownRef}>
                    <label className="text-xs font-bold uppercase tracking-wider text-white/70 block mb-2">Technologies Used</label>
                    <div
                        className="w-full min-h-[42px] bg-zinc-900/50 border border-primary/20 hover:border-primary/45 rounded-xl px-4 py-2 flex flex-wrap gap-2 items-center cursor-text focus-within:border-primary/75"
                        onClick={() => setTechDropdownOpen(true)}
                    >
                        {techStack.map((tech) => (
                            <span key={tech} className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                {tech}
                                <X className="w-3.5 h-3.5 cursor-pointer hover:text-white" onClick={(e) => { e.stopPropagation(); toggleTech(tech); }} />
                            </span>
                        ))}
                        <input
                            type="text"
                            value={customTech}
                            onChange={(e) => setCustomTech(e.target.value)}
                            onKeyDown={addCustomTech}
                            className="bg-transparent border-none outline-none text-xs text-white flex-1 min-w-[100px]"
                            placeholder={techStack.length === 0 ? "Select or type..." : ""}
                            onFocus={() => setTechDropdownOpen(true)}
                        />
                        <ChevronDown className="w-4 h-4 text-white/30 ml-auto shrink-0" />
                    </div>
                    {techDropdownOpen && (
                        <div className="absolute z-50 w-full mt-2 max-h-60 overflow-y-auto bg-[#0a0a0c] border border-primary/20 rounded-xl shadow-2xl p-2 grid grid-cols-2 gap-1">
                            {COMMON_TECH_STACK.map((tech) => {
                                const isSelected = techStack.includes(tech);
                                return (
                                    <div
                                        key={tech}
                                        onClick={() => toggleTech(tech)}
                                        className={`px-3 py-2 rounded-lg text-xs cursor-pointer flex items-center justify-between ${isSelected ? "bg-primary/10 text-primary" : "hover:bg-white/5 text-white/70"}`}
                                    >
                                        {tech}
                                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-6 border-t border-white/[0.04] space-y-6">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-white/70">Your Contributions (Features & Evidence)</label>
                    <button onClick={addFeature} className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                        <Plus className="w-3 h-3" /> Add Feature
                    </button>
                </div>
                <div className="space-y-4">
                    {features.map((feature, idx) => (
                        <div key={feature.id} className="bg-zinc-950/60 border border-primary/20 hover:border-primary/45 rounded-xl p-4 relative group">
                            {features.length > 1 && (
                                <button onClick={() => removeFeature(feature.id)} className="absolute top-4 right-4 text-white/20 hover:text-red-400 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            <div className="space-y-4 mr-6">
                                <input
                                    type="text"
                                    value={feature.name}
                                    onChange={(e) => updateFeature(feature.id, "name", e.target.value)}
                                    placeholder={`Feature ${idx + 1} Name (e.g. Resume Parser)`}
                                    className="w-full bg-transparent border-b border-primary/20 hover:border-primary/45 px-2 py-1.5 text-xs text-white focus:border-primary/75 focus:outline-none"
                                />
                                <input
                                    type="text"
                                    value={feature.description}
                                    onChange={(e) => updateFeature(feature.id, "description", e.target.value)}
                                    placeholder="Briefly describe what this feature does..."
                                    className="w-full bg-transparent border-b border-primary/20 hover:border-primary/45 px-2 py-1.5 text-xs text-white focus:border-primary/75 focus:outline-none"
                                />
                                <textarea
                                    value={feature.commits}
                                    onChange={(e) => updateFeature(feature.id, "commits", e.target.value)}
                                    placeholder="Provide additional details or notes (e.g. tools used, metrics, key accomplishments)"
                                    className="w-full h-20 bg-zinc-900/30 border border-primary/20 hover:border-primary/45 rounded-lg px-3 py-2 text-xs text-white/70 focus:border-primary/75 focus:outline-none resize-none"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
                <button
                    onClick={onSubmit}
                    disabled={uploading}
                    className="w-full py-3.5 bg-primary text-black font-extrabold text-[11px] uppercase tracking-[0.15em] rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:hover:scale-100 shadow-[0_0_15px_rgba(242,170,76,0.15)]"
                >
                    {uploading ? "Saving Project Details..." : "Save Project Details"}
                </button>
            </div>
        </div>
    );
}
