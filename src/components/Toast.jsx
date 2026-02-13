import React, { useEffect } from "react";
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";

/**
 * Toast Component
 * @param {string} id - Unique identifier for the toast
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {string} message - The message to display
 * @param {function} onClose - Function to call on dismissal
 * @param {number} duration - Auto-dismiss duration in ms
 */
const Toast = ({ id, type, message, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
    };

    const borderColors = {
        success: "border-green-500",
        error: "border-red-500",
        warning: "border-yellow-500",
        info: "border-blue-500",
    };

    return (
        <div
            className={`flex items-center w-full max-w-xs p-4 cursor-pointer space-x-3 text-slate-100 bg-slate-800 rounded-lg shadow-lg border-l-4 ${borderColors[type]} transition-all duration-300 animate-slide-in hover:shadow-xl`}
            role="alert"
            onClick={() => onClose(id)}
        >
            {icons[type]}
            <div className="flex-1 text-sm font-medium pr-2">{message}</div>
            <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg focus:ring-2 focus:ring-slate-600 p-1.5 inline-flex h-8 w-8 items-center justify-center transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose(id);
                }}
            >
                <span className="sr-only">Close</span>
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Toast;
