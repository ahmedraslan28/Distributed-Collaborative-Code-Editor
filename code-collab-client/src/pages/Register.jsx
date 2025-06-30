import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { userAtom } from "../atoms/userAtom";
import { connectedUsersAtom } from "../atoms/connectedUsersAtom";

import { socketAtom } from "../atoms/socketAtom";
import { useNavigate } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { buttonStatusAtom, chatMessagesAtom, codeAtom, inputAtom, isLoadingAtom, languageAtom, outputAtom } from "../atoms/shared";

export default function Register() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    roomId: "",
  });
  const [user, setUser] = useAtom(userAtom);
  const [socket, setSocket] = useAtom(socketAtom);
  const [connectedUsers, setConnectedUsers] = useAtom(connectedUsersAtom);
  const [code, setCode] = useAtom(codeAtom);
  const [input, setInput] = useAtom(inputAtom);
  const [output, setOutput] = useAtom(outputAtom);
  const [language, setLanguage] = useAtom(languageAtom);
  const [chatMessages, setChatMessages] = useAtom(chatMessagesAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
    const [currentButtonState, setCurrentButtonState] = useAtom(buttonStatusAtom);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const roomIdFromUrl = searchParams.get("roomId");
    if (roomIdFromUrl) {
      setRoomId(roomIdFromUrl);
    }
  }, [searchParams]);

  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {
      name: "",
      roomId: "",
    };
    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
    }
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!roomId.trim()) {
      newErrors.roomId = "Room ID is required";
    } else if (!uuidRegex.test(roomId.trim())) {
      newErrors.roomId = "unvalid Room ID";
    }
    setErrors(newErrors);
    return !newErrors.name && !newErrors.roomId;
  };

  const initializeSocket = () => {
    if (!validateForm()) {
      return;
    }

    const userId = user.id || crypto.randomUUID();

    setIsLoading(true);

    const client = new Client({
      brokerURL: `ws://localhost:8080/ws`,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log("Connected to WebSocket");

        client.subscribe(`/queue/errors/${name}`, (res) => {
          try {
            const errorMessage = JSON.parse(res.body);
            console.error("Private error:", errorMessage);
            errorMessage.message
              ? toast.error(errorMessage.message)
              : toast.error("Something went wrong.");
            setIsLoading(false);
          } catch (e) {
            console.error("Error parsing error message:", e);
            toast.error("An unexpected error occurred.");
            setIsLoading(false);
          }
        });

        client.subscribe(`/topic/room/${roomId}`, (res) => {
          try {
            const response = JSON.parse(res.body);
            console.log("Room response:", response);
            const message = response.message;
            const messageUsername = message.username;
            const event = message.event;

            if (event === "JOIN_ROOM") {
              if (messageUsername === name) {
                console.log("language:", response.language);
                console.log("chat messages:", response.chatMessages);
                console.log("connected users:", response.users);
                setUser({
                  id: userId,
                  name: name,
                  roomId: roomId,
                });
                setSocket(client);
                setConnectedUsers(response.users[1]);
                setChatMessages(response.chatMessages[1]);
                setCode(response.code);
                setInput(response.input);
                setOutput(response.output);
                setLanguage(response.language);
                navigate(`/code/${roomId}`);
                setIsLoading(false);
                setCurrentButtonState("Submit Code");
                setOutput([]);
              } else {
                toast.info(`${messageUsername} joined the room.`);
              }
            } else if (event === "LEAVE_ROOM") {
              setConnectedUsers(response.users[1]);
              toast.info(`${messageUsername} left the room.`);
            }
          } catch (e) {
            console.error("Error parsing room message:", e);
          }
        });

        client.publish({
          destination: "/app/room/join",
          body: JSON.stringify({
            username: name,
            roomId: roomId,
            event: "JOIN_ROOM",
            message: `${name} joined the room`,
          }),
        });
      },
      onStompError: (frame) => {
        console.error("STOMP error: " + frame.headers["message"]);
        console.error("Details: " + frame.body);
        alert("WebSocket error: " + frame.body);
        setIsLoading(false);
      },
      onWebSocketError: (error) => {
        console.error("WebSocket connection error:", error);
        alert("Network error. Please try again.");
        setIsLoading(false);
      },
      onWebSocketClose: (event) => {
        console.log("WebSocket connection closed:", event);
        setIsLoading(false);
      },
      onDisconnect: () => {
        console.log("WebSocket connection closed.");
        setSocket(null);
        setUser({ id: "", name: "", roomId: "" });
        setIsLoading(false);
      },
    });

    client.onDisconnect = () => {
      setSocket(null);
      setUser({ id: "", name: "", roomId: "" });
      setIsLoading(false);
    };

    client.activate();
  };

  const handleGenerateRoomId = () => {
    const newRoomId = crypto.randomUUID();
    setRoomId(newRoomId);
    setErrors((prev) => ({ ...prev, roomId: "" }));
  };

  const handleJoinRoom = () => {
    if (validateForm()) {
      axios
        .post("http://localhost:8080/api/rooms", {
          username: name,
          roomId: roomId,
        })
        .then(() => initializeSocket())
        .catch((error) => {
          toast.error(
            error.response.data.message || "Username is already taken."
          );
        });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-purple-400 mb-6">
          Collaborative Code Editor
        </h1>
        <p className="text-center text-gray-400 mb-6">
          Join an existing room or create a new one
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-teal-400 mb-2">
            Your Name
          </label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              // Clear name error when typing
              setErrors((prev) => ({ ...prev, name: "" }));
            }}
            className={`w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 ${
              errors.name
                ? "border-2 border-red-500 focus:ring-red-500"
                : "focus:ring-purple-500"
            } transition duration-200`}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-teal-400 mb-2">
            Room ID
          </label>
          <input
            type="text"
            placeholder="Enter room ID"
            value={roomId}
            onChange={(e) => {
              setRoomId(e.target.value);
              setErrors((prev) => ({ ...prev, roomId: "" }));
            }}
            className={`w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 ${
              errors.name
                ? "border-2 border-red-500 focus:ring-red-500"
                : "focus:ring-purple-500"
            } transition duration-200`}
          />
          {errors.roomId && (
            <p className="text-red-500 text-xs mt-1">{errors.roomId}</p>
          )}
          {/* New line for Generate Room ID link */}{" "}
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleGenerateRoomId}
              className="text-sm text-purple-500 hover:text-purple-600"
            >
              create a new room? generate a Room ID
            </button>
          </div>
        </div>

        <button
          disabled={isLoading}
          onClick={handleJoinRoom}
          className={`w-full py-3 text-white rounded-lg font-medium transition-colors duration-200 ${
            isLoading
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-pink-500 hover:bg-pink-600"
          }`}
        >
          {isLoading ? "Joining..." : "Join Room"}
        </button>
      </div>
    </div>
  );
}
