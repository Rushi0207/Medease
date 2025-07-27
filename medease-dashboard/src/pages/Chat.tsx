import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Video, Phone, PhoneOff } from 'lucide-react';
import VideoChat from '../components/Chat/VideoChat';

interface ChatRoom {
  id: string;
  name: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: string;
}

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [showVideoChat, setShowVideoChat] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch chat rooms from API
    const fetchChatRooms = async () => {
      try {
        setLoading(true);
        // For now, using mock data - replace with actual API call
        const mockRooms: ChatRoom[] = [
          {
            id: '1',
            name: 'Dr. Sarah Johnson',
            participants: ['patient', 'dr-sarah'],
            lastMessage: 'Your test results look good!',
            lastMessageTime: '2 hours ago'
          },
          {
            id: '2',
            name: 'Dr. Michael Chen',
            participants: ['patient', 'dr-michael'],
            lastMessage: 'Please take your medication as prescribed',
            lastMessageTime: '1 day ago'
          }
        ];
        setChatRooms(mockRooms);
      } catch (error) {
        console.error('Error fetching chat rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatRooms();
  }, []);

  const startVideoCall = () => {
    setShowVideoChat(true);
  };

  const endVideoCall = () => {
    setShowVideoChat(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Chat Rooms Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>
        <div className="overflow-y-auto">
          {chatRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedRoom?.id === room.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{room.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{room.lastMessage}</p>
                  <p className="text-xs text-gray-400">{room.lastMessageTime}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900">{selectedRoom.name}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={startVideoCall}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Start Video Call"
                >
                  <Video className="h-5 w-5" />
                </button>
                <button
                  onClick={startVideoCall}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Start Voice Call"
                >
                  <Phone className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 bg-gray-50 overflow-y-auto">
              <div className="space-y-4">
                {/* Sample messages - replace with real messages */}
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-xs">
                    <p>Hello Doctor, I have some questions about my medication.</p>
                    <p className="text-xs text-blue-100 mt-1">10:30 AM</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white rounded-lg px-4 py-2 max-w-xs shadow-sm">
                    <p>Of course! I'm here to help. What would you like to know?</p>
                    <p className="text-xs text-gray-500 mt-1">10:32 AM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a chat room to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Video Chat Modal */}
      {showVideoChat && selectedRoom && (
        <VideoChat
          roomId={selectedRoom.id}
          onEndCall={endVideoCall}
          userName={user?.firstName || 'User'}
        />
      )}
    </div>
  );
};

export default Chat;