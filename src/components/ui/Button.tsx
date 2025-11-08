'use client'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
};

export function Button({ children, ...props }: ButtonProps) {
    return (
        <button
            className="w-80 relative overflow-hidden bg-[#FAC638] hover:bg-[#FAC638]/80 transition-transform duration-150 ease-out 
            text-[#1A1A1A] px-4 py-2 rounded font-semibold active:scale-95 active:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#FAC638]/50"
            {...props}
        >
            {children}
        </button>
    );
}