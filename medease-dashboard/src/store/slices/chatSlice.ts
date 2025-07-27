import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: "text" | "image" | "file";
  isFromDoctor: boolean;
}

export interface ChatRoom {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isActive: boolean;
}

export interface ChatState {
  chatRooms: ChatRoom[];
  activeChat: ChatRoom | null;
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
}

const initialState: ChatState = {
  chatRooms: [],
  activeChat: null,
  messages: [],
  isLoading: false,
  isTyping: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChatRooms: (state, action: PayloadAction<ChatRoom[]>) => {
      state.chatRooms = action.payload;
    },
    setActiveChat: (state, action: PayloadAction<ChatRoom>) => {
      state.activeChat = action.payload;
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const chatRoom = state.chatRooms.find(
        (room) => room.id === action.payload
      );
      if (chatRoom) {
        chatRoom.unreadCount = 0;
      }
    },
  },
});

export const {
  setChatRooms,
  setActiveChat,
  setMessages,
  addMessage,
  setLoading,
  setTyping,
  markAsRead,
} = chatSlice.actions;
export default chatSlice.reducer;
