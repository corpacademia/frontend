import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function initSocket(userId: string, orgId?: string | null) {
    if (!socket) {
        socket = io("http://localhost:3000",{
            withCredentials:true
        });
        socket.on("connect", () => {
            console.log("Socket connected");
            socket.emit("join_rooms", { userId, orgId: orgId || null });
        });
    }
    return socket;
}

export function getSocket() {
    return socket;
}
