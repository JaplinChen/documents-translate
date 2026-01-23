import React from 'react';

/**
 * Common IconButton component for consistent UI across the app.
 */
export const IconButton = ({
    icon: Icon,
    onClick,
    className = "",
    variant = "ghost",
    title = "",
    size = "md",
    ...props
}) => {
    const baseClass = "flex items-center justify-center rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";

    const variants = {
        ghost: "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
        action: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
        danger: "text-red-500 hover:bg-red-50 focus:ring-red-500",
    };

    const sizes = {
        sm: "p-1",
        md: "p-2",
        lg: "p-3",
    };

    return (
        <button
            onClick={onClick}
            className={`${baseClass} ${variants[variant] || variants.ghost} ${sizes[size] || sizes.md} ${className}`}
            title={title}
            {...props}
        >
            {Icon && <Icon size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />}
        </button>
    );
};

export default IconButton;
