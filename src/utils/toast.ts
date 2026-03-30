import { toast, ToastOptions } from "react-toastify";

export const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
  const options: ToastOptions = {
    position: "top-center",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
    icon: ({type}) => type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️',
  };

  return toast[type](message, options);
};