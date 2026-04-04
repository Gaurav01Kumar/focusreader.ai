import { useEffect, useState } from "react";
import { AuthApiService } from "../apis/auth.service";
import { useDispatch } from "react-redux";
import { login } from "../redux/slice/authSlice";

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const location = window.location.pathname;
    const dispatch = useDispatch();

    async function checkAuth() {
        try {
            const response:any = await AuthApiService.getInstance().checkAuth();
            if (response?.statusCode === 200) {
                dispatch(login(response.data));
            } else {
                if (location !== "/") {
                    window.location.href = "/";
                }
            }
        } catch (error) {
            if (location !== "/") {
                window.location.href = "/";
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        checkAuth();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0C0C0E] flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-2 border-[#E8C77A] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[#8A8A94] text-sm font-medium animate-pulse">Verifying session...</p>
            </div>
        );
    }

    return <>{children}</>;
}