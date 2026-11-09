import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "../components/DashboardSidebar"
import { Toaster } from "@/components/ui/toast"

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <SidebarProvider>
            <DashboardSidebar></DashboardSidebar>
            <main className="min-w-0 flex-1">
                <SidebarTrigger />
                {children}
            </main>
             <Toaster />
        </SidebarProvider>
    )
};

export default DashboardLayout;