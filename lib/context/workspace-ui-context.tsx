"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface ScrollState {
  [routeKey: string]: number;
}

interface TabState {
  [panelKey: string]: string;
}

interface WorkspaceUIState {
  scrollPositions: ScrollState;
  activeTabs: TabState;
  expandedPanels: Set<string>;
  lastRoute: string | null;
}

interface WorkspaceUIContextType {
  saveScrollPosition: (route: string, offset: number) => void;
  getScrollPosition: (route: string) => number;

  saveActiveTab: (panelKey: string, tabValue: string) => void;
  getActiveTab: (panelKey: string, fallback?: string) => string;

  togglePanel: (panelId: string) => void;
  isPanelExpanded: (panelId: string) => boolean;

  setLastRoute: (route: string) => void;
  lastRoute: string | null;
}

const WorkspaceUIContext = createContext<WorkspaceUIContextType | undefined>(
  undefined
);

export function WorkspaceUIProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkspaceUIState>({
    scrollPositions: {},
    activeTabs: {},
    expandedPanels: new Set(),
    lastRoute: null,
  });

  const saveScrollPosition = useCallback((route: string, offset: number) => {
    setState((prev) => ({
      ...prev,
      scrollPositions: { ...prev.scrollPositions, [route]: offset },
    }));
  }, []);

  const getScrollPosition = useCallback(
    (route: string) => {
      return state.scrollPositions[route] ?? 0;
    },
    [state.scrollPositions]
  );

  const saveActiveTab = useCallback((panelKey: string, tabValue: string) => {
    setState((prev) => ({
      ...prev,
      activeTabs: { ...prev.activeTabs, [panelKey]: tabValue },
    }));
  }, []);

  const getActiveTab = useCallback(
    (panelKey: string, fallback = "") => {
      return state.activeTabs[panelKey] ?? fallback;
    },
    [state.activeTabs]
  );

  const togglePanel = useCallback((panelId: string) => {
    setState((prev) => {
      const next = new Set(prev.expandedPanels);
      if (next.has(panelId)) {
        next.delete(panelId);
      } else {
        next.add(panelId);
      }
      return { ...prev, expandedPanels: next };
    });
  }, []);

  const isPanelExpanded = useCallback(
    (panelId: string) => {
      return state.expandedPanels.has(panelId);
    },
    [state.expandedPanels]
  );

  const setLastRoute = useCallback((route: string) => {
    setState((prev) => ({ ...prev, lastRoute: route }));
  }, []);

  return (
    <WorkspaceUIContext.Provider
      value={{
        saveScrollPosition,
        getScrollPosition,
        saveActiveTab,
        getActiveTab,
        togglePanel,
        isPanelExpanded,
        setLastRoute,
        lastRoute: state.lastRoute,
      }}
    >
      {children}
    </WorkspaceUIContext.Provider>
  );
}

export function useWorkspaceUI() {
  const context = useContext(WorkspaceUIContext);
  if (!context) {
    throw new Error(
      "useWorkspaceUI must be used within a WorkspaceUIProvider"
    );
  }
  return context;
}
