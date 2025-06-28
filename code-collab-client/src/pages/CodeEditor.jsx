import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MonacoEditor from "@monaco-editor/react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { IoSendSharp } from "react-icons/io5";
import { useAtom } from "jotai";
import { userAtom } from "../atoms/userAtom";
import { socketAtom } from "../atoms/socketAtom";
import { connectedUsersAtom } from "../atoms/connectedUsersAtom";
import { chatMessagesAtom, codeAtom, inputAtom, languageAtom, outputAtom } from "../atoms/shared";


export default function CodeEditor() {
  const [code, setCode] = useAtom(codeAtom);
  const [language, setLanguage] = useAtom(languageAtom);
  const [output, setOutput] = useAtom(outputAtom);
  const [input, setInput] = useAtom(inputAtom);
  const [chatMessages, setChatMessages] = useAtom(chatMessagesAtom);
  const [connectedUsers, setConnectedUsers] = useAtom(connectedUsersAtom);
  
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [currentButtonState, setCurrentButtonState] = useState("Run Code");
  const [socket, setSocket] = useAtom(socketAtom);
  const [user, setUser] = useAtom(userAtom);

  const [isCopied, setIsCopied] = useState(false);

  const navigate = useNavigate();
  const parms = useParams();
  const chatContainerRef = useRef(null);

  const userColors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-orange-500",
    "bg-cyan-500",
  ];

  const copyRoomId = () => {
    navigator.clipboard.writeText(user.roomId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
    if (!socket) {
      navigate(`/?roomId=${parms.roomId}`);
      return;
    }

    const subscription = socket.subscribe(`/topic/room/${user.roomId}`,(res) => {
        const response = JSON.parse(res.body);
        const event = response.message.event;
        if (event === "JOIN_ROOM" || event === "LEAVE_ROOM") {
          setConnectedUsers(response.users);
        } else if (event === "LANGUAGE_CHANGE") {
          setLanguage(response.language);
        } else if (event === "INPUT_CHANGE") {
          setInput(response.input);
        } else if (event === "CHAT_MESSAGE") {
          setChatMessages((prev) => [...prev, response.chatMessage]);
        } else if (event === "CODE_UPDATE") {
          setCode(response.code);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };

    // socket.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   // // on change of Submit Button Status
    //   // if (data.type === "submitBtnStatus") {
    //   //   setCurrentButtonState(data.value);
    //   //   setIsLoading(data.isLoading);
    //   // }
    //   // // on change of output
    //   // if (data.type === "output") {
    //   //   setOutput((prevOutput) => [...prevOutput, data.message]);
    //   //   handleButtonStatus("Submit Code", false);
    //   // }

    //   // // on receive cursor position
    //   // if (data.type === "cursorPosition") {
    //   //   // Update cursor position for the user
    //   //   const updatedUsers = connectedUsers.map((user) => {
    //   //     if (user.id === data.userId) {
    //   //       return { ...user, cursorPosition: data.cursorPosition };
    //   //     }
    //   //     return user;
    //   //   });
    //   //   setConnectedUsers(updatedUsers);
    //   // }

    //   // // on recive cursor poisition
    //   // if (data.type === "cursorPosition") {
    //   //   const updatedUsers = connectedUsers.map((user) => {
    //   //     if (user.id === data.userId) {
    //   //       return { ...user, cursorPosition: data.cursorPosition };
    //   //     }
    //   //     return user;
    //   //   });
    //   //   console.log("updatedUsers", updatedUsers);

    //   //   setConnectedUsers(updatedUsers);
    //   // }
    // };
  }, [socket, user.roomId]);

  const handleSubmit = async () => {
    // Display a simple output for demo purposes
    setOutput((prev) => [...prev, "Hello, world!"]);

    // handleButtonStatus("Submitting...", true);
    // const submission = {
    //   code,
    //   language,
    //   roomId: user.roomId,
    //   input
    // };

    // socket?.send(user?.id ? user.id : "");

    // const res = await fetch(`http://${IP_ADDRESS}:3000/submit`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(submission),
    // });

    // handleButtonStatus("Compiling...", true);

    // if (!res.ok) {
    //   setOutput((prevOutput) => [
    //     ...prevOutput,
    //     "Error submitting code. Please try again.",
    //   ]);
    //   handleButtonStatus("Submit Code", false);
    // }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    socket.publish({
      destination: "/app/room/inputChange",
      body: JSON.stringify({
        input: e.target.value,
      }),
    });
  };

  const languageInitCode = {
    javascript: `// Welcome to the Collaborative Code Editor\n// Start coding here...\n\nfunction helloWorld() {\n  console.log("Hello, world!");\n}\n\nhelloWorld();`,
    python: `# Welcome to the Collaborative Code Editor\n# Start coding here...\n\ndef helloWorld():\n    print("Hello, world!")\n\nhelloWorld()`,
    cpp: `// Welcome to the Collaborative Code Editor\n// Start coding here...\n\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, world!" << endl;\n    return 0;\n}`,
    java: `// Welcome to the Collaborative Code Editor\n// Start coding here...\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n    }\n}`
  };

  const handleLanguageChange = (value) => {
    if (value === language) return;
    if (window.confirm("Changing the language will erase your current code. Are you sure you want to continue?")) {
      setLanguage(value);
      setCode(languageInitCode[value]);
      socket.publish({
        destination: "/app/room/languageChange",
        body: JSON.stringify({
          language: value,
        }),
      });
    }
  };

  const handleButtonStatus = (value, isLoading) => {
    setCurrentButtonState(value);
    setIsLoading(isLoading);
    socket?.send(
      JSON.stringify({
        type: "submitBtnStatus",
        value: value,
        isLoading: isLoading,
        roomId: user.roomId,
      })
    );
  };

  const handleEditorDidMount = (editor, monaco) => {
    console.log("editor", editor);
    console.log("monaco", monaco);

    if (editor) {
      editor.onDidChangeModelContent((event) => {
        console.log("Code Updated:", editor.getValue());
        setCode(editor.getValue());
        socket.publish({
          destination: "/app/room/codeUpdate",
          body: JSON.stringify({
            code: editor.getValue(),
          }),
        });
      });

      editor.onDidChangeCursorSelection((event) => {
        const selection = editor.getSelection();
        const selectedText = editor.getModel().getValueInRange(selection);
        console.log("Cursor Selection:", selection);
        console.log(
          "Cursor Position:",
          selection.startLineNumber,
          selection.endColumn
        );
        console.log("Selected Code:", selectedText);
      });
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMessage = {
      user: user.name || "You",
      message: chatInput,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };

    setChatInput("");

    socket.publish({
      destination: "/app/room/chatMessage",
      body: JSON.stringify({
        chatMessage: newMessage,
      }),
    });
  };

  const handleLeaveRoom = () => {
    console.log("WebSocket connection closed.");

    if (socket.connected && user.name) {
      try {
        socket.publish({
          destination: "/app/room/leave",
        });
      } catch (error) {
        console.log("Error sending leave message:", error);
      }
    }
    socket.deactivate();
    setUser({
      id: "",
      name: "",
      roomId: "",
    });
    setSocket(null);
    navigate("/");
  };

  const appTitle = "Code Collab Editor";

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header Bar */}
      <header className="bg-gray-800 p-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="text-xl font-semibold text-purple-400 flex items-center">
            <span className="text-2xl mr-2">&lt;&gt;</span>
            {appTitle}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {" "}
          <div className="text-blue-400 hidden md:flex items-center space-x-4">
            <div className="flex items-center">
              <span>#{user.roomId || "ledngjjs"}</span>
              <button
                onClick={copyRoomId}
                className="ml-2 text-sm bg-gray-700 hover:bg-gray-600 px-2 py-0.5 rounded"
                title="Copy room ID"
              >
                {isCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button
              onClick={handleLeaveRoom}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center"
              title="Leave Room"
            >
              Leave Room
            </button>
          </div>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-gray-700 text-white px-2 py-1 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Left Sidebar - Chat */}
        <div className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-purple-400">Room Chat</h2>
          </div>

          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-3 space-y-3"
          >
            {" "}
            {chatMessages.map((msg, index) => {
              const isCurrentUser = msg.user === (user.name || "You");
              const userIndex = connectedUsers.findIndex((u) => u === msg.user);
              const userColor = userColors[userIndex % userColors.length];
              const bgColor = userColor.replace("bg-", "bg-opacity-20 bg-");

              return (
                <div
                  key={index}
                  className={`${
                    isCurrentUser ? "ml-auto" : "mr-auto"
                  } ${bgColor} rounded-lg p-3 max-w-[80%]`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${userColor}`}
                      ></div>
                      <span className="font-medium text-white">
                        {msg.user} {isCurrentUser && "(You)"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{msg.time}</span>
                  </div>
                  <p className="text-sm text-white">{msg.message}</p>
                </div>
              );
            })}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSendChat}
            className="p-3 border-t border-gray-700 flex"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              className="bg-gray-700 text-white px-3 py-2 rounded-l-md flex-1 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-purple-500 hover:bg-purple-600 px-3 py-2 rounded-r-md"
            >
              <IoSendSharp />
            </button>
          </form>
        </div>
        {/* Center - Code Editor */}
        <div className="flex-1 flex flex-col">
          {/* Line numbers and code editor */}
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              value={code}
              language={language}
              theme="vs-dark"
              className="h-full w-full"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: "on",
                glyphMargin: true,
                folding: true,
                automaticLayout: true,
              }}
              onMount={handleEditorDidMount}
            />
          </div>

          {/* Output Section */}
          <div className="h-64 border-t border-gray-700 flex flex-col">
            {" "}
            <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
              <h3 className="text-gray-300 flex items-center">Output</h3>
              <button
                onClick={handleSubmit}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-1 rounded-md flex items-center"
                disabled={isLoading}
              >
                {isLoading && (
                  <AiOutlineLoading3Quarters className="animate-spin mr-2" />
                )}
                {currentButtonState}
              </button>
            </div>
            <div className="flex-1 bg-gray-900 p-3 overflow-y-auto font-mono text-sm">
              {output.length > 0 ? (
                output.map((line, index) => (
                  <div key={index} className="text-gray-300">
                    {line}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic">
                  Code output will appear here after execution
                </div>
              )}
            </div>
          </div>
        </div>{" "}
        {/* Right Sidebar - Users and Input */}
        <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col h-full overflow-hidden">
          {/* Online Users Section */}
          <div className="flex-none bg-gray-800">
            <div className="p-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-purple-400 flex items-center justify-between">
                <span>Online Users</span>
                <span className="bg-green-500 text-xs rounded-full px-2 py-0.5">
                  {connectedUsers.length}
                </span>
              </h2>
            </div>

            <div className="p-3 space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {connectedUsers.map((user, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  <div
                    className={`${
                      userColors[index % userColors.length]
                    } w-3 h-3 rounded-full`}
                  ></div>
                  <span className="text-gray-200">{user}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Input Section */}
          <div className="flex-1 flex flex-col min-h-0 p-3 border-t border-gray-700">
            <h2 className="text-lg font-semibold text-purple-400 flex items-center mb-2 flex-none">
              Input
            </h2>
            <div className="flex-1 min-h-0">
              <textarea
                value={input}
                onChange={(e) => handleInputChange(e)}
                placeholder="Enter your program input here..."
                className="bg-gray-700 text-white w-full h-full p-3 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
              ></textarea>
            </div>{" "}
          </div>
        </div>
      </div>
    </div>
  );
}
