import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { AdminNotificationProvider } from "@/context/AdminNotificationContext";

const AdminRootLayout = ({ children }: { children?: ReactNode }) => {
    return (
        <AdminAuthProvider>
            <AdminNotificationProvider>
                {children || <Outlet />}
            </AdminNotificationProvider>
        </AdminAuthProvider>
    );
};

export default AdminRootLayout;
