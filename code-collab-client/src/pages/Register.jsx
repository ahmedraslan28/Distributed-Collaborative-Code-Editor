import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { userAtom } from "../atoms/userAtom";
import { socketAtom } from "../atoms/socketAtom";
import { useNavigate } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import { useSearchParams } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    roomId: "",
  });

  const [searchParams] = useSearchParams();

  
  useEffect(() => {
    const roomIdFromUrl = searchParams.get("roomId");
    if (roomIdFromUrl) {
      setRoomId(roomIdFromUrl);
    }
  }, [searchParams]);

  const [user, setUser] = useAtom(userAtom);
  const [socket, setSocket] = useAtom(socketAtom);

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
    setUser({
      id: userId,
      name: name,
      roomId: roomId,
    });
    navigate(`/code/${roomId}`);
    // setLoading(true);
    // const client = new Client({
    //   brokerURL: `ws://localhost:8080/ws`,
    //   onConnect: () => {
    //     const userId = user.id || crypto.randomUUID();
    //     client.subscribe(`/topic/room/${roomId}`, (message) => {
    //       const roomData = JSON.parse(message.body);
    //       if (roomData.status === "success") {
    //         // Update user state
    //         setUser({
    //           id: userId,
    //           name: name,
    //           roomId: roomId,
    //         });
    //         // Store socket client in Jotai state
    //         setSocket(client);
    //         // Navigate to code editor
    //         navigate(`/code/${roomId}`);
    //       } else {
    //         // Handle room join failure
    //         alert(roomData.message || "Failed to join room");
    //         setLoading(false);
    //       }
    //     });
    //     // Send join room request
    //     client.publish({
    //       destination: "/app/room/join",
    //       body: JSON.stringify({
    //         userId: userId,
    //         userName: name,
    //         roomId: roomId,
    //       }),
    //     });
    //   },
    //   onStompError: (frame) => {
    //     console.error("Broker reported error: " + frame.headers["message"]);
    //     console.error("Additional details: " + frame.body);
    //     alert("Failed to connect to room");
    //     setLoading(false);
    //   },
    //   onWebSocketError: (error) => {
    //     console.error("WebSocket connection error:", error);
    //     alert("Network error. Please try again.");
    //     setLoading(false);
    //   },
    //   onDisconnect: () => {
    //     console.log("WebSocket connection closed.");
    //     setLoading(false);
    //   },
    // });
    // // Activate the client to initiate connection
    // client.activate();
  };

  const handleGenerateRoomId = () => {
    const newRoomId = crypto.randomUUID();
    setRoomId(newRoomId);
    setErrors((prev) => ({ ...prev, roomId: "" }));
  };

  const handleJoinRoom = () => {
    if (validateForm()) {
      
      initializeSocket();
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

          {/* New line for Generate Room ID link */}
          <div className="mt-2 flex justify-end">
            <a
              href="#"
              onClick={handleGenerateRoomId}
              className="text-sm text-purple-500 hover:text-purple-600"
            >
              create a new room? generate a Room ID
            </a>
          </div>
        </div>

        <button
          disabled={loading}
          onClick={handleJoinRoom}
          className={`w-full py-3 text-white rounded-lg font-medium transition-colors duration-200 ${
            loading
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-pink-500 hover:bg-pink-600"
          }`}
        >
          {loading ? "Joining..." : "Join Room"}
        </button>
      </div>
    </div>
  );
}
