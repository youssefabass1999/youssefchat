import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/ChatContainer.css";

interface ChatContainerProps {
  currentChat: any;
  socket: any;
  currentUser: any;
  token: string | null;
}

interface MessageType {
  fromSelf: boolean;
  message: string;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  currentChat,
  socket,
  currentUser,
  token,
}) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const apiUrl = process.env.REACT_APP_API_URL;

  // Shared getColor function for avatar background
  const getColor = (name: string) => {
    const colors = ["#6c63ff", "#f97316", "#10b981", "#ef4444", "#3b82f6"];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  // 🟡 Fetch messages between users
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChat || !token || !currentUser?._id) return;

      try {
        const res = await axios.get(
          `${apiUrl}/api/messages/${currentUser._id}/${currentChat._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("📥 [ChatContainer] Messages fetched:", res.data);
        setMessages(
          res.data.map((msg: any) => ({
            fromSelf: msg.from === currentUser._id,
            message: msg.message,
          }))
        );
      } catch (err) {
        console.error("❌ [ChatContainer] Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [currentChat, token, currentUser]);

  // 🟣 Socket listener for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg: string, fromId: string) => {
      console.log("📡 [Socket] Received message from:", fromId);
      console.log("📛 [Check] currentChat._id:", currentChat?._id);

      const chatId = currentChat?._id?.toString();

      if (!chatId) {
        console.warn("⚠️ [Arrival] currentChat._id not yet available. Retrying...");
        setTimeout(() => {
          if (currentChat?._id?.toString() === fromId) {
            console.log("✅ [Retry Match] Adding delayed message.");
            setMessages((prev) => [...prev, { fromSelf: false, message: msg }]);
          } else {
            console.warn("🚫 [Retry Match] Still not matching. Ignored.");
          }
        }, 500);
      } else if (fromId === chatId) {
        console.log("✅ [Arrival] Matches current chat. Adding to UI.");
        setMessages((prev) => [...prev, { fromSelf: false, message: msg }]);
      } else {
        console.log("🟠 [Arrival] Message from other chat. Ignored.");
      }
    };

    socket.on("msg-receive", handleReceiveMessage);

    return () => {
      socket.off("msg-receive", handleReceiveMessage);
    };
  }, [socket, currentChat]);

  // 🟩 Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🟢 Handle sending message
  const sendMessage = async () => {
    if (newMessage.trim() === "" || !currentUser || !currentChat || !token) return;

    const messageData = {
      from: currentUser._id,
      to: currentChat._id,
      message: newMessage,
    };

    try {
      console.log("📤 [ChatContainer] Sending message:", messageData);
      await axios.post(`${apiUrl}/api/messages`, messageData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      socket.emit("send-msg", {
        to: currentChat._id,
        msg: newMessage,
      });

      setMessages((prev) => [...prev, { fromSelf: true, message: newMessage }]);
      setNewMessage("");
    } catch (err) {
      console.error("❌ [ChatContainer] Failed to send message:", err);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div
          className="avatar"
          style={{ backgroundColor: getColor(currentChat?.username || "") }}
        >
          {currentChat?.username?.charAt(0).toUpperCase()}
        </div>
        <h3>{currentChat?.username}</h3>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.fromSelf ? "sent" : "received"}`}
          >
            <div className="content">
              <p>{msg.message}</p>
            </div>
          </div>
        ))}
        <div ref={scrollRef}></div>
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatContainer;
