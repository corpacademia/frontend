import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function initSocket(userId: string, orgId?: string | null,role?:string) {
    if (!socket) {
        socket = io("https://api.golabing.ai",{
            withCredentials:true
        });
        socket.on("connect", () => {
            console.log("Socket connected");
            socket.emit("join_rooms", { userId, orgId: orgId || null,role });
        });
    }
    return socket;
}

export function getSocket() {
    return socket;
}
