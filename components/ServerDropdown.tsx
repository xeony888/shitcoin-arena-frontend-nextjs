import { useEffect, useState } from "react";


type ServerDropdownProps = {
    values: string[];
    title: string;
    onChange: (s: string) => void;
};
export default function ServerDropdown({ values, title, onChange }: ServerDropdownProps) {
    const [active, setActive] = useState<boolean>(false);
    const [selected, setSelected] = useState<string>();
    return (
        <div className="relative w-full">
            {selected ?
                <DropdownItem value={selected} selected onClick={() => setActive(!active)} />
                :
                <p className="text-center hover:cursor-pointer border-2 border-white rounded-lg" onClick={() => { setActive(!active); }}>{title}</p>
            }
            {active &&
                <div className="absolute flex flex-col mt-2 gap-2 justify-center items-center top-[100%] left-0 w-full z-50">
                    {[...values, "Create Server"].map((value, i) => {
                        if (value !== selected) {
                            return <DropdownItem value={value} onClick={() => { setSelected(value), onChange(value); }} key={i} />;
                        } else {
                            return <></>;
                        }
                    })}
                </div>
            }
        </div>
    );
}
type DropdownItemProps = {
    value: string;
    onClick: () => void;
    selected?: boolean;
};
function DropdownItem({ value, onClick, selected }: DropdownItemProps) {
    return (
        <div className={`w-full text-center px-10 py-2 border-2 border-white hover:cursor-pointer ${!selected && "bg-black hover:bg-white hover:text-black"} rounded-lg`} onClick={onClick}>
            {value}
        </div>
    );
}