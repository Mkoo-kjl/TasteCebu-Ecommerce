import { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  // Mobile-only: sidebar is always visible on desktop, toggled on mobile
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const toggleMobileSidebar = () => setMobileSidebarOpen(prev => !prev);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  return (
    <SidebarContext.Provider value={{ mobileSidebarOpen, toggleMobileSidebar, closeMobileSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
