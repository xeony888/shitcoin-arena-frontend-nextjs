


export function shortenAddress(address: string): string {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4, address.length)}`;
}
export function shortenShortenAddress(address: string): string {
    if (!address) return "";
    return `${address.substring(0, 2)}..${address.substring(address.length - 2, address.length)}`;
}

export function filter(a: any, as: any[], d: number) {
    return as.filter(b => distance(a, b) < d);
}
export function d(x: number, y: number): number {
    return Math.sqrt(x ** 2 + y ** 2);
}

export function distance(a: any, b: any): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}