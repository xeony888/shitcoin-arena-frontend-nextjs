


export function shortenAddress(address: string): string {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4, address.length)}`;
}
export function shortenShortenAddress(address: string): string {
    if (!address) return "";
    return `${address.substring(0, 2)}..${address.substring(address.length - 2, address.length)}`;
}