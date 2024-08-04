
type SelectProps = {
    text: string;
    onClick: () => any;
    selected?: boolean;
    disabled?: boolean;
};
export default function Select({ text, onClick, selected, disabled }: SelectProps) {
    return (
        <div onClick={!disabled ? onClick : () => null} className={`text-center text-lg w-full border-b-2 ${selected ? "border-white" : "border-black hover:border-gray-500 hover:cursor-pointer"} ${disabled ? "hover:cursor-not-allowed" : ""}`}>
            {text}
        </div>
    );
}