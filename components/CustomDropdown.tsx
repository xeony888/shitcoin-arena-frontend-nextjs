import { useState } from "react";
import { shortenAddress } from "./utils";

type DropdownItemProps = {
    img: string;
    name: string;
    address: string;
    onClick: () => void;
    selected?: boolean;
};
type CustomDropdownProps = {
    values: any[];
    onChange: (v: any) => void;
    title: string;
};
export default function CustomDropdown({ values, title, onChange }: CustomDropdownProps) {
    const [selected, setSelected] = useState<any>();
    const [active, setActive] = useState<boolean>(false);
    return (
        <div className="relative w-full">
            {selected ?
                <DropdownItem {...selected} selected onClick={() => setActive(!active)} />
                :
                <p className="text-center hover:cursor-pointer border-2 border-white rounded-lg" onClick={() => setActive(!active)}>{title}</p>
            }
            {active &&
                <div className="absolute flex flex-col mt-2 gap-2 justify-start items-center top-[100%] left-0 w-full z-50 max-h-[200px] overflow-auto">
                    {values.map((value, i) => {
                        if (value.name != selected?.name) {
                            return <DropdownItem {...value} onClick={() => { setSelected(value), onChange(value); }} key={i} />;
                        } else {
                            return <></>;
                        }
                    })}
                </div>
            }
        </div>
    );
}

function DropdownItem({ img, name, address, selected, onClick }: DropdownItemProps) {
    return (
        <div className={`w-full flex flex-row justify-between items-center px-10 py-2 border-2 border-white hover:cursor-pointer ${!selected && "bg-black hover:bg-white hover:text-black"} rounded-lg`} onClick={onClick}>
            <img src={img} className="w-10 aspect-square rounded-full" />
            <p className="text-center flex-grow">{name}</p>
            <a href={`https://birdeye.so/token/${address}`} className="hover:underline" target="_blank">{shortenAddress(address)}</a>
        </div>
    );
}