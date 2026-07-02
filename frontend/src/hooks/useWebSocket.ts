"use client"

import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  message?: string;
  attachment_url?: string;
  voice_note_url?: string;
  sender?: string;
  msg_id?: string;
}

export function useWebSocket(url: string) {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const connectingRef = useRef(false);

  const connect = useCallback(() => {
    if (!mountedRef.current || connectingRef.current) return;
    connectingRef.current = true;
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) {
          ws.close();
          return;
        }
        setIsConnected(true);
        connectingRef.current = false;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          setMessages((prev) => [...prev, data]);
        } catch (error) {
          console.error("Error parsing WS message:", error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        connectingRef.current = false;
        if (mountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error("WS Error:", error);
        ws.close();
      };
    } catch (error) {
      connectingRef.current = false;
      console.error("Failed to establish WS:", error);
    }
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const sendMessage = useCallback((payload: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      console.warn("Cannot send message, WS not connected.");
    }
  }, []);

  return { messages, isConnected, sendMessage };
}
