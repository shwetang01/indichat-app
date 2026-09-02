import React, { useState } from "react";
import useLayoutStore from "../../store/layoutStore";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { useChatStore } from "../../store/chatStore";
import { FaPlus, FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import formatTimestamp from "../../utils/formatTime";

const ChatList = ({ contacts }) => {
  const setSelectedContact = useLayoutStore(
    (state) => state.setSelectedContact
  );
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { isUserOnline, resetUnreadCount } = useChatStore();
  const [searchTerms, setSearchTerms] = useState("");

  const filteredContacts = contacts?.filter((contact) =>
    contact?.username?.toLowerCase().includes(searchTerms.toLowerCase())
  );

  // Sort contacts: newest messages first, followed by others
  const sortedContacts = [...(filteredContacts || [])].sort((a, b) => {
    const aTime = a.conversation?.lastMessage?.createdAt
      ? new Date(a.conversation.lastMessage.createdAt).getTime()
      : a.conversation?.updatedAt
      ? new Date(a.conversation.updatedAt).getTime()
      : 0;
    const bTime = b.conversation?.lastMessage?.createdAt
      ? new Date(b.conversation.lastMessage.createdAt).getTime()
      : b.conversation?.updatedAt
      ? new Date(b.conversation.updatedAt).getTime()
      : 0;
    return bTime - aTime;
  });

  return (
    <div
      className={`w-full border-r h-screen ${
        theme === "dark"
          ? "bg-[rgb(17,27,33)] border-gray-600"
          : "bg-white border-gray-200"
      }`}
    >
      <div
        className={`p-4 flex justify-between ${
          theme === "dark" ? "text-white " : "text-gray-800"
        }`}
      >
        <h2 className="text-xl font-semibold">chats</h2>
        <button className="p-2 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition-colors">
          <FaPlus />
        </button>
      </div>
      <div className="p-2 ">
        <div className="relative">
          <FaSearch
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-800"
            } `}
          />
          <input
            type="text"
            placeholder="search or start new chat"
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
            ${
              theme === "dark"
                ? "bg-gray-800 text-white border-gray-700 placeholder-gray-500"
                : "bg-gray-100 text-black border-gray-200 placeholder-gray-400"
            }`}
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(100vh-120px)]">
        {sortedContacts.map((contact) => {
          const online = isUserOnline(contact._id) || contact?.isOnline;
          const lastMsg = contact?.conversation?.lastMessage;
          const receiverId = lastMsg?.receiver?._id || lastMsg?.receiver;
          const isReceiver = !receiverId || String(receiverId) === String(user?._id);

          return (
            <motion.div
              key={contact._id}
              onClick={() => {
                resetUnreadCount(contact._id);
                setSelectedContact(contact);
              }}
              className={`p-3 flex items-center cursor-pointer ${
                theme === "dark"
                  ? selectedContact?._id === contact?._id
                    ? "bg-gray-700"
                    : "hover:bg-gray-800"
                  : selectedContact?._id === contact?._id
                  ? "bg-gray-200"
                  : "hover:bg-gray-100"
              }`}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={contact?.profilePicture || "/placeholder.svg"}
                  alt={contact?.username}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://api.dicebear.com/6.x/avataaars/svg?seed=Felix";
                  }}
                />
                {online && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-[rgb(17,27,33)] rounded-full" />
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h2
                    className={`font-semibold truncate ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    {contact?.username}
                  </h2>

                  {lastMsg?.createdAt && (
                    <span
                      className={`text-xs ml-2 flex-shrink-0 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {formatTimestamp(lastMsg.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-baseline mt-0.5">
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    } truncate mr-2`}
                  >
                    {lastMsg?.contentType === "image"
                      ? "📷 Photo"
                      : lastMsg?.contentType === "video"
                      ? "🎥 Video"
                      : lastMsg?.content || contact?.about || "Hey there! I am using IndiChat."}
                  </p>
                  {contact?.conversation &&
                    contact?.conversation?.unreadCount > 0 &&
                    isReceiver && (
                      <p
                        className={`text-xs font-semibold min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-green-500 text-white rounded-full flex-shrink-0`}
                      >
                        {contact.conversation.unreadCount}
                      </p>
                    )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;
