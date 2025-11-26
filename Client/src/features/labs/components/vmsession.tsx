import React, { useEffect, useRef } from "react";
import Guacamole from "guacamole-common-js";
import { useLocation } from "react-router-dom";

export default function VmSession() {
  const displayRef = useRef<HTMLDivElement | null>(null);
  const clientRef = useRef<any>(null);
  const location = useLocation();
  const { guacUrl, vmTitle } = (location.state as any) || {};

  useEffect(() => {
    if (!guacUrl) {
      console.error("Missing guacUrl");
      return;
    }
    let wsUrl = guacUrl;

// Remove accidental ?undefined
wsUrl = wsUrl.replace('?undefined', '');

// Remove accidental double question mark
wsUrl = wsUrl.replace('??', '?');
    console.log("Connecting to", wsUrl);

    const tunnel = new Guacamole.WebSocketTunnel(wsUrl);

    tunnel.onstatechange = (s: number) => {
      console.log("Tunnel state:", s);
      if (s === Guacamole.Tunnel.State.OPEN) {
        // send size once open
        const width = Math.floor(window.innerWidth);
        const height = Math.floor(window.innerHeight);
        const dpi = 96;
        console.log("Sending size", width, height, dpi);
        clientRef.current.sendSize(width, height, dpi);
      }
    };

    const client = new Guacamole.Client(tunnel);
    clientRef.current = client;

    const displayEl = client.getDisplay().getElement();
    if (displayRef.current) {
      displayRef.current.innerHTML = "";
      displayRef.current.appendChild(displayEl);
    }

    client.connect();

    // keyboard
    const keyboard = new Guacamole.Keyboard(document);
    keyboard.onkeydown = (keysym: number) => client.sendKeyEvent(1, keysym);
    keyboard.onkeyup = (keysym: number) => client.sendKeyEvent(0, keysym);

    // mouse
    const mouse = new Guacamole.Mouse(displayEl);
    mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = (s: any) => client.sendMouseState(s);

    const onResize = () => {
      if (clientRef.current) clientRef.current.sendSize(window.innerWidth, window.innerHeight, 96);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      keyboard.onkeydown = null; keyboard.onkeyup = null;
      mouse.onmousedown = null; mouse.onmouseup = null; mouse.onmousemove = null;
      client.disconnect();
    };
  }, [guacUrl]);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <div style={{ background: "#111", color: "#f60", padding: 6 }}>{vmTitle || "VM"}</div>
      <div ref={displayRef} style={{ width: "100%", height: "calc(100% - 36px)" }} />
    </div>
  );
}
