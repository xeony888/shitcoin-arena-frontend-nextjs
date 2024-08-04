

type BasicButtonProps = {
    text: string;
    onClick: () => void;
};
export default function BasicButton({ text, onClick }: BasicButtonProps) {
    return (
        <button className="rounded-lg py-2 px-8 text-center border-2 border-white hover:bg-white hover:text-black text-xl" onClick={onClick}>
            {text}
        </button>
    );
}